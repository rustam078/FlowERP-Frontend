import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Modal, Button, Tag, DatePicker, Select, Drawer, Empty, Form, notification } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';

interface AttendanceCalendarProps {
  employeeId: string;
  focusDate?: string;
  openLeaveSignal?: number; // bumped by the "Record Leave" quick action to open the apply-leave modal
}

/**
 * Exception-based attendance: every day is PRESENT by default. Click a day to mark it
 * ABSENT / HALF_DAY (or clear it). Only exceptions are stored; used for monthly payroll.
 */
const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ employeeId, focusDate, openLeaveSignal }) => {
  const t = useT();
  const qc = useQueryClient();
  const [month, setMonth] = useState(dayjs());

  // Jump the calendar to the page's global date filter when it changes.
  useEffect(() => {
    if (focusDate) setMonth(dayjs(focusDate));
  }, [focusDate]);
  const [sel, setSel] = useState<dayjs.Dayjs | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [listFilter, setListFilter] = useState<'ALL' | 'ABSENT' | 'HALF_DAY'>('ALL');
  // Leaves older than 1 month are locked: not editable/deletable and not counted.
  const lockBefore = dayjs().subtract(1, 'month');
  const isLocked = (d: string) => dayjs(d).isBefore(lockBefore, 'day');
  // Drawer date filter — defaults to 1 month back → 2 months ahead (user can widen it).
  const [listRange, setListRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(1, 'month').startOf('day'), dayjs().add(2, 'month').endOf('day'),
  ]);
  // Apply-leave modal (date range or a single day).
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm] = Form.useForm();
  const [applying, setApplying] = useState(false);

  // Open the leave modal whenever the "Record Leave" action fires.
  useEffect(() => {
    if (openLeaveSignal) {
      leaveForm.setFieldsValue({ range: [dayjs(), dayjs()], status: 'ABSENT' });
      setLeaveOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLeaveSignal]);
  const from = month.startOf('month').format('YYYY-MM-DD');
  const to = month.endOf('month').format('YYYY-MM-DD');

  const { data } = useQuery({
    queryKey: ['attendance', employeeId, from, to],
    queryFn: () => employeeService.getAttendance(employeeId, from, to),
    enabled: !!employeeId,
  });

  const map = useMemo(() => {
    const m: Record<string, string> = {};
    (data?.data || []).forEach((a: any) => { m[a.date] = a.status; });
    return m;
  }, [data]);

  // List window follows the drawer's date filter.
  const listFrom = listRange[0].format('YYYY-MM-DD');
  const listTo = listRange[1].format('YYYY-MM-DD');
  const { data: listData } = useQuery({
    queryKey: ['attendance', employeeId, 'list', listFrom, listTo],
    queryFn: () => employeeService.getAttendance(employeeId, listFrom, listTo),
    enabled: !!employeeId,
  });
  const markedList = (listData?.data || []).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
  // Count excludes locked (older than 1 month) leaves.
  const activeCount = markedList.filter((a: any) => !isLocked(a.date)).length;

  // Collapse consecutive same-status days into ranges: 13,14,15 Absent → {13→15, ABSENT}.
  const groupedRanges = useMemo(() => {
    const filtered = markedList.filter((a: any) => listFilter === 'ALL' || a.status === listFilter);
    const out: { fromDate: string; toDate: string; status: string; locked: boolean }[] = [];
    for (const a of filtered) {
      const last = out[out.length - 1];
      if (last && last.status === a.status && dayjs(a.date).diff(dayjs(last.toDate), 'day') === 1) {
        last.toDate = a.date;
      } else {
        out.push({ fromDate: a.date, toDate: a.date, status: a.status, locked: isLocked(a.date) });
      }
    }
    return out.reverse(); // latest on top
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData, listFilter]);

  // Attendance changes affect leave cards, summary and salary slips — refresh them all.
  const refetch = () => {
    qc.invalidateQueries({ queryKey: ['attendance', employeeId] });
    qc.invalidateQueries({ queryKey: ['payroll', employeeId] });
    qc.invalidateQueries({ queryKey: ['employeeDetails', employeeId] });
  };
  const clearRange = async (fromDate: string, toDate: string) => {
    const days: string[] = [];
    let d = dayjs(fromDate);
    while (!d.isAfter(dayjs(toDate), 'day')) { days.push(d.format('YYYY-MM-DD')); d = d.add(1, 'day'); }
    await Promise.all(days.map((dt) => employeeService.clearAttendance(employeeId, dt)));
    refetch();
  };

  // Delete a leave range from the drawer, with a themed confirmation.
  const confirmClear = (fromDate: string, toDate: string, label: string) => {
    Modal.confirm({
      title: t('employees.attendance.deleteTitle', 'Remove this leave?'),
      content: label,
      okText: t('common.delete', 'Delete'),
      cancelText: t('common.cancel', 'Cancel'),
      okButtonProps: { style: { background: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } },
      onOk: () => clearRange(fromDate, toDate),
    });
  };

  const selLocked = sel ? isLocked(sel.format('YYYY-MM-DD')) : false;

  const mark = async (status: 'ABSENT' | 'HALF_DAY') => {
    if (!sel) return;
    await employeeService.markAttendance(employeeId, sel.format('YYYY-MM-DD'), status);
    setSel(null); refetch();
  };
  const clear = async () => {
    if (!sel) return;
    await employeeService.clearAttendance(employeeId, sel.format('YYYY-MM-DD'));
    setSel(null); refetch();
  };

  // Apply leave over a date range (a single day = same start/end). Jumps the calendar to it.
  const applyLeave = async () => {
    const v = await leaveForm.validateFields();
    const [start, end] = v.range as [dayjs.Dayjs, dayjs.Dayjs];
    setApplying(true);
    try {
      await employeeService.markAttendanceRange(employeeId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'), v.status);
      setLeaveOpen(false);
      if (start.month() !== month.month() || start.year() !== month.year()) setMonth(start);
      refetch();
      notification.success({ message: t('employees.attendance.rangeMarked', 'Leave applied'), placement: 'topRight' });
    } finally {
      setApplying(false);
    }
  };

  // Marked days show as a bold colour dot: red = absent, blue = half-day (clearly distinct).
  const cellRender = (current: dayjs.Dayjs, info: any) => {
    if (info.type !== 'date') return info.originNode;
    const st = map[current.format('YYYY-MM-DD')];
    if (!st) return null;
    const color = st === 'ABSENT' ? '#DC2626' : '#2563EB';
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 1 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 22%, white)` }} />
      </div>
    );
  };

  const selKey = sel ? sel.format('YYYY-MM-DD') : '';
  return (
    <div>
      {/* One row, right-aligned: Marked days first, then the month picker (follows the global filter). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Button icon={<UnorderedListOutlined />} onClick={() => setListOpen(true)}>
          {t('employees.attendance.marked', 'Marked days')} ({activeCount})
        </Button>
        <DatePicker
          picker="month" value={month} format="MMMM YYYY" allowClear={false}
          onChange={(d) => { if (d) setMonth(d); }}
        />
      </div>
      {/* Lighter, cleaner calendar inside a soft bordered panel */}
      <div className="attendance-calendar" style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '4px 10px 10px', background: '#fff' }}>
        <Calendar
          fullscreen={false}
          value={month}
          onPanelChange={(v) => setMonth(v)}
          onSelect={(d, info: any) => { if (!info || info.source === 'date') setSel(d); }}
          cellRender={cellRender}
          headerRender={() => null}
        />
      </div>
      {/* Marked days drawer — grouped into ranges, filterable, clearable */}
      <Drawer open={listOpen} onClose={() => setListOpen(false)} placement="right" width={380} zIndex={1300}
        title={t('employees.attendance.marked', 'Marked days')}
      >
        <RangePicker value={listRange as any} onChange={(d) => { if (d && d[0] && d[1]) setListRange([d[0], d[1]]); }}
          format="DD-MMM-YYYY" allowClear={false} style={{ width: '100%', marginBottom: 10 }} />
        <Select value={listFilter} onChange={(v) => setListFilter(v)} style={{ width: '100%', marginBottom: 12 }}
          options={[
            { value: 'ALL', label: t('common.all', 'All') },
            { value: 'ABSENT', label: t('employees.attendance.absent', 'Absent') },
            { value: 'HALF_DAY', label: t('employees.attendance.half', '½ Day') },
          ]}
        />
        {groupedRanges.length === 0 ? (
          <Empty description={t('employees.attendance.noMarked', 'No marked days')} />
        ) : groupedRanges.map((r) => {
          const single = r.fromDate === r.toDate;
          const future = dayjs(r.fromDate).isAfter(dayjs(), 'day');
          const label = single ? dayjs(r.fromDate).format('DD MMM YYYY')
            : `${dayjs(r.fromDate).format('DD MMM')} – ${dayjs(r.toDate).format('DD MMM YYYY')}`;
          return (
            <div key={r.fromDate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>
                {label}
                {future && <Tag color="blue" style={{ marginLeft: 6 }}>{t('employees.attendance.upcoming', 'Upcoming')}</Tag>}
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color={r.status === 'ABSENT' ? 'error' : 'blue'} style={{ margin: 0 }}>
                  {r.status === 'ABSENT' ? t('employees.attendance.absent', 'Absent') : t('employees.attendance.half', '½ Day')}
                </Tag>
                {r.locked ? (
                  <Tag style={{ margin: 0, color: '#94A3B8', borderColor: '#E2E8F0' }}>{t('employees.attendance.locked', 'Locked')}</Tag>
                ) : (
                  <Button size="small" type="text" danger onClick={() => confirmClear(r.fromDate, r.toDate, label)}>×</Button>
                )}
              </span>
            </div>
          );
        })}
      </Drawer>

      <Modal open={!!sel} onCancel={() => setSel(null)} footer={null} title={sel ? sel.format('DD MMM YYYY') : ''} zIndex={1300}>
        {selLocked ? (
          <div style={{ marginTop: 8, color: '#64748B' }}>
            {t('employees.attendance.lockedMsg', 'This date is older than 1 month and is locked. It cannot be updated or deleted.')}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <Button danger onClick={() => mark('ABSENT')}>{t('employees.attendance.markAbsent', 'Mark Absent')}</Button>
            <Button onClick={() => mark('HALF_DAY')}>{t('employees.attendance.markHalf', 'Mark Half-day')}</Button>
            {map[selKey] && <Button type="dashed" onClick={clear}>{t('employees.attendance.clear', 'Clear (Present)')}</Button>}
          </div>
        )}
      </Modal>

      {/* Apply leave for a date range or a single day (from "Record Leave") */}
      <Modal open={leaveOpen} onCancel={() => setLeaveOpen(false)} onOk={applyLeave} confirmLoading={applying} zIndex={1300}
        title={t('employees.attendance.applyLeave', 'Apply Leave')} okText={t('employees.attendance.applyRange', 'Apply')} cancelText={t('common.cancel', 'Cancel')}>
        <Form form={leaveForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="range" label={t('employees.attendance.leaveDates', 'From – To (same day for one day)')} rules={[{ required: true, message: t('employees.attendance.pickDates', 'Select date(s)') }]}>
            <RangePicker format="DD-MMM-YYYY" allowClear style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label={t('employees.attendance.leaveType', 'Leave Type')} rules={[{ required: true }]}>
            <Select options={[
              { value: 'ABSENT', label: t('employees.attendance.absent', 'Absent') },
              { value: 'HALF_DAY', label: t('employees.attendance.half', '½ Day') },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceCalendar;
