import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog"
import FormDialog from "../../../../../components/common/FormDialog"

const Dialogs = ({ dialog, handleOnDialogClose, handleOnDialogSubmit, inputs }) => {

    if (dialog.action === 'delete') {
        return (
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogSubmit}
            />
        )
    }

    return (
        <FormDialog
            {...dialog}
            handleClose={handleOnDialogClose}
            handleSubmit={handleOnDialogSubmit}
            processing={dialog.processing}
            children={inputs}
        />
    )
}

export default Dialogs
