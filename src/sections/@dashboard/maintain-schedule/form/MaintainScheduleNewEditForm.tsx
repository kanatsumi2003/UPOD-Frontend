import { yupResolver } from '@hookform/resolvers/yup';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Button, Card, CircularProgress, Grid, Stack, TextField } from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { values } from 'lodash';
import { useSnackbar } from 'notistack';
import { Technician } from 'src/@types/user';
import { useState } from 'react';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from 'src/components/dialog/ConfirmDialog';
import { FormProvider, RHFTextField } from 'src/components/hook-form';
import useAuth from 'src/hooks/useAuth';
import useToggle from 'src/hooks/useToggle';
import { PATH_DASHBOARD } from 'src/routes/paths';
import axios from 'src/utils/axios';
import * as Yup from 'yup';
import { MaintainTitleSection } from '../../maintain-report/form/MaintainTitleSection';
import TechnicianDialog from '../../request/dialog/TechnicianDialog';

type Props = {
  currentMaintainSchedule: any;
  isEdit: boolean;
};

export default function MaintainScheduleNewEditForm({ currentMaintainSchedule, isEdit }: Props) {
  const serviceSchema = Yup.object().shape({
    name: Yup.string().trim().required('Name is required'),
  });

  const navigate = useNavigate();

  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [currentTechnician, setCurrentTechnician] = useState<Technician>();

  const isCustomer = user?.account?.roleName === 'Customer';

  const { enqueueSnackbar } = useSnackbar();

  const defaultValues = {
    code: currentMaintainSchedule?.code || '',
    name: currentMaintainSchedule?.name || '',
    maintainTime: currentMaintainSchedule?.maintain_time,
    agency: {
      name: currentMaintainSchedule.agency.agency_name,
      id: currentMaintainSchedule.agency.id,
    },
    contract: {
      id: currentMaintainSchedule.contract.id,
      name: currentMaintainSchedule.contract.name,
    },
    technician: currentMaintainSchedule.technician,
    createDate: currentMaintainSchedule?.create_date,
    startTime: currentMaintainSchedule?.start_time,
    endTime: currentMaintainSchedule?.end_time,
    status: currentMaintainSchedule.status,
    description: currentMaintainSchedule.description,
  };

  const handleConfirm = (value: Technician) => {
    setCurrentTechnician(value);
  };
  const updateMaintainSchedule = useCallback(async (data: any) => {
    try {
      const response: any = await axios.put(
        '/api/maintenance_schedules/update_maintenance_schedule_by_id',
        data,
        {
          params: { id: currentMaintainSchedule!.id },
        }
      );
      if (response.status === 200 || response.status === 201) {
        setIsLoading(false);

        navigate(PATH_DASHBOARD.admin.maintainSchedule.root);
        enqueueSnackbar('Update maintain schedule successfully', { variant: 'success' });
      } else {
        setIsLoading(false);

        enqueueSnackbar(response.message, { variant: 'error' });
      }
    } catch (error) {
      setIsLoading(false);

      enqueueSnackbar('Update  maintain schedule failed', { variant: 'error' });
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteMaintainSchedule = useCallback(async () => {
    try {
      const response = await axios.put(
        '/api/maintenance_schedules/disable_maintenance_schedule_by_id',
        {},
        {
          params: { id: currentMaintainSchedule!.id },
        }
      );
      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar('Delete maintain schedule successfully', { variant: 'success' });
        setIsLoading(false);

        navigate(PATH_DASHBOARD.admin.maintainSchedule.root);
      } else {
        setIsLoading(false);

        enqueueSnackbar('Delete maintain schedule successfully', { variant: 'success' });
      }
    } catch (error) {
      setIsLoading(false);

      enqueueSnackbar('Delete agency failed', { variant: 'error' });
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (data: any) => {
    if (isEdit) {
      setIsLoading(true);
      const params = {
        id: currentMaintainSchedule!.id,
        description: data.description,
        technician_id: currentTechnician?.id || defaultValues.technician.id,
        maintain_time: data.maintainTime,
      };
      updateMaintainSchedule(params);
    }
  };

  const methods = useForm({
    resolver: yupResolver(serviceSchema),
    defaultValues,
  });
  const { toggle: openDialog, onClose: onCloseDialog, setToggle: setOpenDialog } = useToggle(false);

  const {
    toggle: openDeleteDialog,
    onClose: onCloseDeleteDialog,
    setToggle: setOpenDeleteDialog,
  } = useToggle(false);

  const onConfirmDelete = () => {
    deleteMaintainSchedule();
  };

  const {
    toggle: openConfirmDialog,
    onClose: onConfirmDialogClose,
    setToggle: setOpenConfirmDialog,
  } = useToggle();

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const disableNameDescription =
    currentMaintainSchedule.status === 'MAINTAINING' ||
    currentMaintainSchedule.status === 'COMPLETED' ||  currentMaintainSchedule.status === 'MISSED';

  const editPage = isEdit && currentMaintainSchedule;

  const disableTechnician = !(
    (currentMaintainSchedule.status === 'NOTIFIED' && !isCustomer) ||
    (currentMaintainSchedule.status === 'SCHEDULED' && !isCustomer) ||
    (currentMaintainSchedule.status === 'WARNING' && !isCustomer) ||
    (currentMaintainSchedule.status === 'PREPARING' && !isCustomer)
  );
  const status = currentMaintainSchedule.status.toLowerCase();
  return (
    <>
      <FormProvider onSubmit={handleSubmit(onSubmit)} methods={methods}>
        {isEdit && (
          <Box mb={2}>
            <MaintainTitleSection label={currentMaintainSchedule.code} status={watch('status')} />
          </Box>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <RHFTextField name="name" label="Name" disabled />
                <Controller
                  name="maintainTime"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Maintain Time"
                      inputFormat="dd/MM/yyyy"
                      value={field.value}
                      disabled={disableNameDescription}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  )}
                />
                <RHFTextField
                  name="description"
                  label="Description"
                  multiline
                  minRows={4}
                  disabled={disableNameDescription}
                />
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* {isEdit && <TitleSection label={getValues('code')} status={watch('status')} />} */}

                <TextField
                  disabled
                  value={currentMaintainSchedule.agency.agency_name}
                  label="Agency"
                />
                <TextField
                  disabled={disableTechnician}
                  value={currentTechnician?.tech_name || defaultValues.technician.tech_name}
                  label="Techician"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setOpenConfirmDialog(true);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ readOnly: true }}
                />
                <TextField
                  disabled
                  value={currentMaintainSchedule.contract.name}
                  label="Contract"
                />
                {status === 'completed' && (
                  <>
                    <TextField
                      disabled
                      value={format(
                        new Date(currentMaintainSchedule.start_time),
                        'HH:mm dd/MM/yyy'
                      )}
                      label="Start Time"
                      fullWidth
                    />
                    <TextField
                      disabled
                      value={format(new Date(currentMaintainSchedule.end_time), 'HH:mm dd/MM/yyy')}
                      label="End Time"
                      fullWidth
                    />
                  </>
                )}
              </Stack>
              {!disableTechnician && (
                <TechnicianDialog
                  open={openConfirmDialog}
                  onClose={onConfirmDialogClose}
                  onSelect={handleConfirm}
                  id={currentMaintainSchedule.id}
                  ismaintain={true}
                  agencyId={null}
                  serviceId={null}
                />
              )}
            </Card>
          </Grid>
        </Grid>

        {(currentMaintainSchedule.status === 'SCHEDULED' ||
          currentMaintainSchedule.status === 'NOTIFIED' ||
          currentMaintainSchedule.status === 'WARNING' ||
          currentMaintainSchedule.status === 'PREPARING') && (
          <Stack mt={3} direction="row" justifyContent="end" textAlign="end" spacing={2}>
            {/* <Button variant="outlined" color="error" onClick={onDeleteClick}>
              Delete
            </Button> */}
            <LoadingButton loading={isSubmitting} variant="contained" type="submit">
              {editPage ? 'Save' : 'Create'}
            </LoadingButton>
          </Stack>
        )}
      </FormProvider>
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {<CircularProgress />}
        </Box>
      )}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={onCloseDeleteDialog}
        onConfirm={onConfirmDelete}
        title="Delete Maintain Schedule"
        text="Are you sure you want to delete?"
      />
    </>
  );
}
