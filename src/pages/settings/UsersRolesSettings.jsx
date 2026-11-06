import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded';
import ToggleOffRoundedIcon from '@mui/icons-material/ToggleOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import userService from '../../services/userService';
import settingsService from '../../services/settingsService';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useT } from '../../contexts/LanguageContext';
import { MODULES, ROLE_ADMIN, ROLE_STAFF } from '../../hooks/usePermissions';

const ROLE_OPTIONS = [
  { value: ROLE_ADMIN, label: 'Admin' },
  { value: ROLE_STAFF, label: 'Staff' },
];

// Dashboard board keys must match DashboardPage BOARDS.
const DASHBOARD_BOARDS = [
  { value: 'overview', label: 'Overview' },
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'employees', label: 'Employees' },
];

const EMPTY_ADD = { username: '', fullName: '', password: '', role: ROLE_STAFF, active: true };

// Build a full STAFF matrix (every module present) from a possibly-partial saved object.
const buildMatrix = (staffPerms) =>
  MODULES.reduce((acc, m) => {
    const p = staffPerms?.[m] || {};
    acc[m] = { view: !!p.view, write: !!p.write, delete: !!p.delete };
    return acc;
  }, {});

const UsersRolesSettings = () => {
  const queryClient = useQueryClient();
  const t = useT();
  const { rolePermissions, staffDashboardBoards } = useAppSettings();

  // ---- Users table ----
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null); // { id, username, fullName, role, active }

  const [pwOpen, setPwOpen] = useState(false);
  const [pwUser, setPwUser] = useState(null); // { id, username }
  const [pwValue, setPwValue] = useState('');
  const [showAddPw, setShowAddPw] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  // Reusable eye toggle adornment for password fields.
  const eyeAdornment = (visible, toggle) => (
    <InputAdornment position="end">
      <IconButton onClick={toggle} edge="end" size="small" tabIndex={-1} aria-label="toggle password visibility">
        {visible ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  const createMutation = useMutation({
    mutationFn: (payload) => userService.create(payload),
    onSuccess: () => {
      message.success(t('settings.users.toast.created', 'User created.'));
      setAddOpen(false);
      setAddForm(EMPTY_ADD);
      invalidateUsers();
    },
    onError: (err) => message.error(err.response?.data?.message || err.message || t('settings.users.toast.createFail', 'Failed to create user.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }) => userService.update(id, rest),
    onSuccess: () => {
      message.success(t('settings.users.toast.updated', 'User updated.'));
      setEditOpen(false);
      setEditForm(null);
      invalidateUsers();
    },
    onError: (err) => message.error(err.response?.data?.message || err.message || t('settings.users.toast.updateFail', 'Failed to update user.')),
  });

  const resetPwMutation = useMutation({
    mutationFn: ({ id, newPassword }) => userService.resetPassword(id, newPassword),
    onSuccess: () => {
      message.success(t('settings.users.toast.pwReset', 'Password reset.'));
      setPwOpen(false);
      setPwUser(null);
      setPwValue('');
    },
    onError: (err) => message.error(err.response?.data?.message || err.message || t('settings.users.toast.pwResetFail', 'Failed to reset password.')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userService.toggleStatus(id),
    onSuccess: () => {
      message.success(t('settings.users.toast.statusUpdated', 'Status updated.'));
      invalidateUsers();
    },
    onError: (err) => message.error(err.response?.data?.message || err.message || t('settings.users.toast.statusFail', 'Failed to change status.')),
  });

  const openEdit = (u) => {
    setEditForm({ id: u.id, username: u.username, fullName: u.fullName || '', role: u.role || ROLE_STAFF, active: !!u.active });
    setEditOpen(true);
  };

  const openReset = (u) => {
    setPwUser({ id: u.id, username: u.username });
    setPwValue('');
    setPwOpen(true);
  };

  const canSubmitAdd =
    addForm.username.trim() && addForm.fullName.trim() && addForm.password.length >= 4;
  const canSubmitEdit = editForm && editForm.fullName.trim();
  const canSubmitPw = pwValue.length >= 4;

  const submitAdd = () => {
    if (!canSubmitAdd) return;
    createMutation.mutate({
      username: addForm.username.trim(),
      password: addForm.password,
      fullName: addForm.fullName.trim(),
      role: addForm.role,
      active: addForm.active,
    });
  };

  const submitEdit = () => {
    if (!canSubmitEdit) return;
    updateMutation.mutate({
      id: editForm.id,
      fullName: editForm.fullName.trim(),
      role: editForm.role,
      active: editForm.active,
    });
  };

  const submitPw = () => {
    if (!canSubmitPw || !pwUser) return;
    resetPwMutation.mutate({ id: pwUser.id, newPassword: pwValue });
  };

  // ---- STAFF permission matrix ----
  const [matrix, setMatrix] = useState(() => buildMatrix(rolePermissions?.STAFF));
  const [savingPerms, setSavingPerms] = useState(false);

  // Re-sync local matrix when the saved permissions load/refresh.
  useEffect(() => {
    setMatrix(buildMatrix(rolePermissions?.STAFF));
  }, [rolePermissions]);

  const setPerm = (module, action, checked) => {
    setMatrix((prev) => {
      const row = { ...prev[module], [action]: checked };
      // Unchecking View makes Write/Delete moot — clear them too.
      if (action === 'view' && !checked) {
        row.write = false;
        row.delete = false;
      }
      return { ...prev, [module]: row };
    });
  };

  const savePermissions = async () => {
    setSavingPerms(true);
    try {
      await settingsService.update('ROLE_PERMISSIONS', JSON.stringify({ STAFF: matrix }));
      message.success(t('settings.users.toast.permsSaved', 'Permissions saved.'));
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    } catch (err) {
      message.error(err.response?.data?.message || err.message || t('settings.users.toast.permsFail', 'Failed to save permissions.'));
    } finally {
      setSavingPerms(false);
    }
  };

  // ---- STAFF dashboard boards ----
  const [boards, setBoards] = useState(() => new Set(staffDashboardBoards || []));
  const [savingBoards, setSavingBoards] = useState(false);
  useEffect(() => { setBoards(new Set(staffDashboardBoards || [])); }, [staffDashboardBoards]);

  const toggleBoard = (value, checked) => {
    setBoards((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value); else next.delete(value);
      return next;
    });
  };

  const saveBoards = async () => {
    setSavingBoards(true);
    try {
      // Persist in the BOARDS order for a stable, predictable dropdown.
      const ordered = DASHBOARD_BOARDS.filter((b) => boards.has(b.value)).map((b) => b.value);
      await settingsService.update('STAFF_DASHBOARD_BOARDS', JSON.stringify(ordered));
      message.success(t('settings.users.toast.boardsSaved', 'Dashboard boards saved.'));
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    } catch (err) {
      message.error(err.response?.data?.message || err.message || t('settings.users.toast.boardsFail', 'Failed to save boards.'));
    } finally {
      setSavingBoards(false);
    }
  };

  const roleChip = (role) => (
    <Chip
      size="small"
      label={role === ROLE_ADMIN ? t('settings.users.role.ADMIN', 'Admin') : t('settings.users.role.STAFF', 'Staff')}
      color={role === ROLE_ADMIN ? 'primary' : 'default'}
      variant={role === ROLE_ADMIN ? 'filled' : 'outlined'}
    />
  );

  const statusChip = (active) => (
    <Chip size="small" label={active ? t('settings.users.active', 'Active') : t('settings.users.inactive', 'Inactive')} color={active ? 'success' : 'default'} variant={active ? 'filled' : 'outlined'} />
  );

  return (
    <Box>
      {/* ---- Users ---- */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{t('settings.users.users', 'Users')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => { setAddForm(EMPTY_ADD); setAddOpen(true); }}>
          {t('settings.users.addUser', 'Add User')}
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('settings.users.colUsername', 'Username')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('settings.users.colFullName', 'Full name')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('settings.users.colRole', 'Role')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.status', 'Status')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{t('common.actions', 'Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.disabled' }}>{t('settings.users.noUsers', 'No users yet.')}</TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{roleChip(u.role)}</TableCell>
                  <TableCell>{statusChip(u.active)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit', 'Edit')}>
                      <IconButton size="small" onClick={() => openEdit(u)}><EditRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('settings.users.resetPassword', 'Reset password')}>
                      <IconButton size="small" onClick={() => openReset(u)}><LockResetRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={u.active ? t('settings.users.deactivate', 'Deactivate') : t('settings.users.activate', 'Activate')}>
                      <span>
                        <IconButton
                          size="small"
                          color={u.active ? 'success' : 'default'}
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={toggleMutation.isPending}
                        >
                          {u.active ? <ToggleOnRoundedIcon fontSize="small" /> : <ToggleOffRoundedIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---- STAFF permission matrix ---- */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{t('settings.users.staffPerms', 'Staff Permissions')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {t('settings.users.staffPermsHelp', 'ADMIN always has full access. These control STAFF.')}
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxWidth: 520 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('settings.users.module', 'Module')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">{t('settings.users.view', 'View')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">{t('settings.users.write', 'Write')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">{t('settings.users.delete', 'Delete')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MODULES.map((m) => {
              const row = matrix[m] || { view: false, write: false, delete: false };
              return (
                <TableRow key={m} hover>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{t('nav.' + m, m)}</TableCell>
                  <TableCell align="center">
                    <Checkbox size="small" checked={row.view} onChange={(e) => setPerm(m, 'view', e.target.checked)} />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox size="small" checked={row.write} disabled={!row.view} onChange={(e) => setPerm(m, 'write', e.target.checked)} />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox size="small" checked={row.delete} disabled={!row.view} onChange={(e) => setPerm(m, 'delete', e.target.checked)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" onClick={savePermissions} disabled={savingPerms}>
        {savingPerms ? t('common.saving', 'Saving…') : t('settings.users.savePerms', 'Save Permissions')}
      </Button>

      {/* ---- STAFF dashboard boards ---- */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 4 }}>{t('settings.users.staffBoards', 'Staff Dashboard Boards')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('settings.users.staffBoardsHelp', 'Which dashboard boards STAFF can open (ADMIN sees all). Staff also need "Dashboard" view permission above.')}
      </Typography>
      <Stack direction="row" flexWrap="wrap" sx={{ mb: 1.5 }}>
        {DASHBOARD_BOARDS.map((b) => (
          <FormControlLabel
            key={b.value}
            sx={{ width: 160 }}
            control={<Checkbox size="small" checked={boards.has(b.value)} onChange={(e) => toggleBoard(b.value, e.target.checked)} />}
            label={t('dashboard.board.' + b.value, b.label)}
          />
        ))}
      </Stack>
      <Button variant="contained" onClick={saveBoards} disabled={savingBoards}>
        {savingBoards ? t('common.saving', 'Saving…') : t('settings.users.saveBoards', 'Save Boards')}
      </Button>

      {/* ---- Add dialog ---- */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('settings.users.addUser', 'Add User')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('settings.users.colUsername', 'Username')}
              size="small"
              required
              value={addForm.username}
              onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
            />
            <TextField
              label={t('settings.users.colFullName', 'Full name')}
              size="small"
              required
              value={addForm.fullName}
              onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
            />
            <TextField
              label={t('settings.users.password', 'Password')}
              type={showAddPw ? 'text' : 'password'}
              size="small"
              required
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              helperText={t('settings.users.min4', 'Minimum 4 characters')}
              error={addForm.password.length > 0 && addForm.password.length < 4}
              InputProps={{ endAdornment: eyeAdornment(showAddPw, () => setShowAddPw((s) => !s)) }}
            />
            <TextField
              label={t('settings.users.colRole', 'Role')}
              select
              size="small"
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t('settings.users.role.' + o.value, o.label)}</MenuItem>)}
            </TextField>
            <FormControlLabel
              control={<Switch checked={addForm.active} onChange={(e) => setAddForm((f) => ({ ...f, active: e.target.checked }))} />}
              label={t('settings.users.activeLabel', 'Active')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={submitAdd} disabled={!canSubmitAdd || createMutation.isPending}>
            {createMutation.isPending ? t('common.saving', 'Saving…') : t('settings.users.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Edit dialog ---- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('settings.users.editUser', 'Edit User')}</DialogTitle>
        <DialogContent>
          {editForm ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label={t('settings.users.colUsername', 'Username')} size="small" value={editForm.username} InputProps={{ readOnly: true }} disabled />
              <TextField
                label={t('settings.users.colFullName', 'Full name')}
                size="small"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              />
              <TextField
                label={t('settings.users.colRole', 'Role')}
                select
                size="small"
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t('settings.users.role.' + o.value, o.label)}</MenuItem>)}
              </TextField>
              <FormControlLabel
                control={<Switch checked={editForm.active} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))} />}
                label={t('settings.users.activeLabel', 'Active')}
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={submitEdit} disabled={!canSubmitEdit || updateMutation.isPending}>
            {updateMutation.isPending ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Reset password dialog ---- */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('settings.users.resetPasswordTitle', 'Reset Password')}{pwUser ? ` — ${pwUser.username}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('settings.users.newPassword', 'New password')}
              type={showResetPw ? 'text' : 'password'}
              size="small"
              required
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              helperText={t('settings.users.min4', 'Minimum 4 characters')}
              error={pwValue.length > 0 && pwValue.length < 4}
              InputProps={{ endAdornment: eyeAdornment(showResetPw, () => setShowResetPw((s) => !s)) }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={submitPw} disabled={!canSubmitPw || resetPwMutation.isPending}>
            {resetPwMutation.isPending ? t('common.saving', 'Saving…') : t('settings.users.reset', 'Reset')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersRolesSettings;
