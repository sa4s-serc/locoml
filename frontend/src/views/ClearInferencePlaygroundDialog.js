import { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Button } from '@mui/material';

const ClearInferencePlaygroundDialog = ({ open, handleClose, handleClear }) => {
    const [choice, setChoice] = useState();
    const [error, setError] = useState(false);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Clear Playground</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure that you would like to clear the playground?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    No
                </Button>
                <Button onClick={handleClear} color="primary">
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClearInferencePlaygroundDialog;
