import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog"
import FormDialog from "../../../../../components/common/FormDialog"

const Dialogs = ({ dialog, handleClose, handleSubmit, inputs }) => {

    if (dialog.method === 'delete') {
        return (
            <ConfirmationDialog
                {...dialog}
                handleClose={handleClose}
                handleConfirm={handleSubmit}
            />
        )
    }

    return (
        <FormDialog
            {...dialog}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
            children={inputs}
        />
    )
}

export default Dialogs
