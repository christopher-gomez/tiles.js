import { Box, Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import React from 'react';
import { ChromePicker as SketchPicker } from 'react-color';
import Tools from '../../lib/utils/Tools';

export default ({ color, modal, onChange, }: { color: string | number, modal?: boolean, onChange?: (color: string) => void }) => {
    const [pickingColor, setPickingColor] = React.useState(false);
    const [currentColor, setCurrentColor] = React.useState(undefined);

    React.useEffect(() => {
        if (currentColor === undefined && color !== undefined) {
            if(typeof color !== 'string') {
                color = Tools.hexColorToString(color);
            }

            setCurrentColor(color);
        }
    }, [color])

    React.useEffect(() => {
        if (currentColor !== undefined) {
            if (onChange) onChange(currentColor);
        }
    }, [currentColor])
    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    padding: '5px',
                    background: 'transparent',
                    borderRadius: '1px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                    display: 'flex',
                    justifyContent: 'end',
                    pl: 0,
                    pr: 0,
                    flexFlow: 'column'
                }}
            >
                <Box sx={{
                    width: '100%',
                    background: currentColor ?? "white",
                    height: 20,
                    borderRadius: '.5em',
                    border: '1px solid black',
                    cursor: 'pointer',
                }} onClick={() => setPickingColor(!pickingColor)}
                />
                {(modal === undefined || !modal) && pickingColor && <Box sx={{
                    mt: 1,
                    width: '100%',
                    background: currentColor ?? "white",
                    display: 'flex',
                    justifyContent: 'center',
                    "&>*": {
                        width: '100% !important'
                    }
                }}>
                    <SketchPicker color={color} onChangeComplete={(color) => {
                        setCurrentColor(color.hex);
                    }} />
                </Box>}
            </Box>
            {modal !== undefined && modal &&
                <Dialog open={pickingColor} onClose={() => {
                    setPickingColor(false);
                }}>
                    <DialogContent>
                        <SketchPicker color={color} onChangeComplete={(color) => {
                            setCurrentColor(color.hex);
                        }} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setPickingColor(false);
                        }}>
                            OK
                        </Button>
                    </DialogActions>
                </Dialog>
            }
        </>
    )
}