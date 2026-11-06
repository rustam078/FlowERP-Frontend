import React, { useMemo, useState } from 'react';
import { Calendar, Modal, Button, Tag, DatePicker, Select, Drawer, Empty, notification } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';

/**
 * Exception-based attendance: every day is PRESENT by default. Click a day to mark it
 * ABSENT / HALF_DAY (or clear it). Only exceptions are stored; used for monthly payroll.
 */
const AttendanceCalendar: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const t = useT();
  const qc = useQueryClient();
  const [month, setMonth] = useState(dayjs());
  const [sel, setSel] = useState<dayjs.Dayjs | null>(null);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [rangeStatus, setRangeStatus] = useState<'ABSENT' | 'HALF_DAY' | 'PRESENT'>('ABSENT');
  const [applying, setApplying] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listFilter, setListFilter] = useState<'ALL' | 'ABSENT' | 'HALF_DAY'>('ALL');
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

  // Wider window (recent past → upcoming) so future-marked leaves are visible in a list.
  const listFrom = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const listTo = dayjs().add(3, 'month').endOf('month').format('YYYY-MM-DD');
  const { data: listData } = useQuery({
    queryKey: ['attendance', employeeId, 'list', listFrom, listTo],
    queryFn: () => employeeService.getAttendance(employeeId, listFrom, listTo),
    enabled: !!employeeId,
  });
  const markedList = (listData?.data || []).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Collapse consecutive same-status days into ranges: 13,14,15 Absent → {13→15, ABSENT}.
  const groupedRanges = useMemo(() => {
    const filtered = markedList.filter((a: any) => listFilter === 'ALL' || a.status === listFilter);
    const out: { fromDate: string; toDate: string; status: string }[] = [];
    for (const a of filtered) {
      const last = out[out.length - 1];
      if (last && last.status === a.status && dayjs(a.date).diff(dayjs(last.toDate), 'day') === 1) {
        last.toDate = a.date;
      } else {
        out.push({ fromDate: a.date, toDate: a.date, status: a.status });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData, listFilter]);

  const refetch = () => qc.invalidateQueries({ queryKey: ['attendance', employeeId] });
  const clearRange = async (fromDate: string, toDate: string) => {
    const days: string[] = [];
    let d = dayjs(fromDate);
    while (!d.isAfter(dayjs(toDate), 'day')) { days.push(d.format('YYYY-MM-DD')); d = d.add(1, 'day'); }
    await Promise.all(days.map((dt) => employeeService.clearAttendance(employeeId, dt)));
    refetch();
  };

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

  // Mark a whole date range at once (10th–20th). "Present" clears the range (rollback to present).
  const applyRange = async () => {
    if (!range || !range[0] || !range[1]) return;
    setApplying(true);
    try {
      if (rangeStatus === 'PRESENT') {
        const days: string[] = [];
        let d = range[0].startOf('day');
        while (!d.isAfter(range[1], 'day')) { days.push(d.format('YYYY-MM-DD')); d = d.add(1, 'day'); }
        await Promise.all(days.map((dt) => employeeService.clearAttendance(employeeId, dt)));
      } else {
        await employeeService.markAttendanceRange(employeeId, range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD'), rangeStatus);
      }
      setRange(null);
      if (range[0].month() !== month.month()) setMonth(range[0]);
      refetch();
      notification.success({ message: t('employees.attendance.rangeMarked', 'Range updated'), placement: 'topRight' });
    } finally {
      setApplying(false);
    }
  };

  const cellRender = (current: dayjs.Dayjs, info: any) => {
    if (info.type !== 'date') return info.originNode;
    const st = map[current.format('YYYY-MM-DD')];
    if (!st) return null;
    return (
      <div style={{ textAlign: 'center' }}>
        <Tag color={st === 'ABSENT' ? 'error' : 'warning'} style={{ margin: 0 }}>
          {st === 'ABSENT' ? t('employees.attendance.absent', 'Absent') : t('employees.attendance.half', '½ Day')}
        </Tag>
      </div>
    );
  };

  const selKey = sel ? sel.format('YYYY-MM-DD') : '';
  return (
    <div>
      {/* Mark a whole range at once */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <RangePicker value={range as any} onChange={(v) => setRange(v as any)} format="DD-MMM" allowClear style={{ flex: '1 1 220px' }} />
        <Select value={rangeStatus} onChange={(v) => setRangeStatus(v)} style={{ width: 150 }}
          options={[
            { value: 'ABSENT', label: t('employees.attendance.absent', 'Absent') },
            { value: 'HALF_DAY', label: t('employees.attendance.half', '½ Day') },
            { value: 'PRESENT', label: t('employees.attendance.present', 'Present (clear)') },
          ]}
        />
        <Button type="primary" loading={applying} disabled={!range || !range[0] || !range[1]} onClick={applyRange}>
          {t('employees.attendance.applyRange', 'Apply')}
        </Button>
        <Button icon={<UnorderedListOutlined />} style={{ marginLeft: 'auto' }} onClick={() => setListOpen(true)}>
          {t('employees.attendance.marked', 'Marked days')} ({markedList.length})
        </Button>
      </div>
      <Calendar
        fullscreen={false}
        value={month}
        onPanelChange={(v) => setMonth(v)}
        onSelect={(d, info: any) => { if (!info || info.source === 'date') setSel(d); }}
        cellRender={cellRender}
        headerRender={({ value, onChange }) => (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 10 }}>
            <DatePicker
              picker="month" value={value} format="MMMM YYYY" allowClear={false}
              onChange={(d) => { if (d) { onChange(d); setMonth(d); } }}
            />
          </div>
        )}
      />
      {/* Marked days drawer — grouped into ranges, filterable, clearable */}
      <Drawer open={listOpen} onClose={() => setListOpen(false)} placement="right" width={380} zIndex={1300}
        title={t('employees.attendance.marked', 'Marked days')}
      >
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
                <Tag color={r.status === 'ABSENT' ? 'error' : 'warning'} style={{ margin: 0 }}>
                  {r.status === 'ABSENT' ? t('employees.attendance.absent', 'Absent') : t('employees.attendance.half', '½ Day')}
                </Tag>
                <Button size="small" type="text" danger onClick={() => clearRange(r.fromDate, r.toDate)}>×</Button>
              </span>
            </div>
          );
        })}
      </Drawer>

      <Modal open={!!sel} onCancel={() => setSel(null)} footer={null} title={sel ? sel.format('DD MMM YYYY') : ''} zIndex={1300}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <Button danger onClick={() => mark('ABSENT')}>{t('employees.attendance.markAbsent', 'Mark Absent')}</Button>
          <Button onClick={() => mark('HALF_DAY')}>{t('employees.attendance.markHalf', 'Mark Half-day')}</Button>
          {map[selKey] && <Button type="dashed" onClick={clear}>{t('employees.attendance.clear', 'Clear (Present)')}</Button>}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceCalendar;
