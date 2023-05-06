import React from 'react';
import { Box, Collapse, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, FormControl, InputLabel, MenuItem, Select, Typography, Slide, SlideProps } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

export interface IEntitiesMenuComponentProps {
    open: boolean;
    onBuildToggled?: (open: boolean) => void;
    entityTypes?: string[];
    entityPlacementTypes?: string[]
    onEntityPlacementTypeSelected?: (placement: string) => void;
    onEntityTypeSelected?: (entityName: string) => void;
    numEntitiesOnMap?: number;
    onRemoveEntitiesToggled?: (open: boolean) => void;
}

export default ({ open, onBuildToggled, entityTypes, entityPlacementTypes, onEntityPlacementTypeSelected, onEntityTypeSelected, onRemoveEntitiesToggled, numEntitiesOnMap }: IEntitiesMenuComponentProps) => {
    const [buildOpen, setBuildOpen] = React.useState(false);
    const [removeOpen, setRemoveOpen] = React.useState(false);
    const [curEntityName, setCurEntityName] = React.useState("");
    const [curEntityPlacementType, setCurEntityPlacementType] = React.useState("");
    const [removeTipOpen, setRemoveTipOpen] = React.useState(false);

    React.useEffect(() => {
        if (open) {

        } else {
            setCurEntityName(entityTypes && entityTypes.length > 0 ? entityTypes[0] : "");
            if (buildOpen) setBuildOpen(false);
            if (removeOpen) setRemoveOpen(false);
        }
    }, [open])

    React.useEffect(() => {

        if (!entityTypes || entityTypes.length === 0) return;

        if (onBuildToggled) onBuildToggled(buildOpen);

        if (buildOpen) {
            if (removeOpen) setRemoveOpen(false);
            if (entityPlacementTypes && entityPlacementTypes.length > 0 && onEntityPlacementTypeSelected) onEntityPlacementTypeSelected(curEntityPlacementType);
            if (entityTypes && entityTypes.length > 0 && onEntityTypeSelected) onEntityTypeSelected(curEntityName);
        } else {
            setCurEntityName(entityTypes && entityTypes.length > 0 ? entityTypes[0] : "");
        }
    }, [buildOpen])


    React.useEffect(() => {
        if (!buildOpen)
            setCurEntityName(entityTypes && entityTypes.length > 0 ? entityTypes[0] : "");
    }, [entityTypes]);

    React.useEffect(() => {
        if (!buildOpen)
            setCurEntityPlacementType(entityPlacementTypes && entityPlacementTypes.length > 0 ? entityPlacementTypes[0] : "");
    }, [entityPlacementTypes])

    React.useEffect(() => {

        if (removeOpen && (!numEntitiesOnMap || numEntitiesOnMap === 0)) return;

        if (onRemoveEntitiesToggled) onRemoveEntitiesToggled(removeOpen);

        if (removeOpen) {
            setBuildOpen(false);
        } else {
        }

        setRemoveTipOpen(removeOpen);

    }, [removeOpen]);

    React.useEffect(() => {
        if (numEntitiesOnMap !== undefined && numEntitiesOnMap === 0 && removeOpen) {
            setRemoveOpen(false);
        }

    }, [numEntitiesOnMap])

    const handleRemoveTipClose = (event) => (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setRemoveTipOpen(false);
    };

    return (
        <>
            <List sx={{
                pl: 4,
                pr: 0,
                display: 'flex',
                flexFlow: 'column',
                justifyItems: 'flex-end',
                textAlign: 'right',
                '& *': {
                    textAlign: 'right !important',
                    justifyContent: 'flex-end',
                    "& label": {
                        "::after": {
                            color: 'transparent',
                            display: 'none'
                        }
                    }
                }
            }}>
                <ListItemButton sx={{ flexFlow: 'row-reverse', mr: 2 }} onClick={() => {
                    setBuildOpen(!buildOpen);
                }}>
                    <ListItemText primary={"Build"} />
                    <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                        {buildOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemIcon>
                </ListItemButton>
                <Collapse in={buildOpen} timeout="auto">
                    <List>
                        <ListItem>
                            <FormControl size="small" fullWidth>
                                <InputLabel id="entity-type-select-label">Entity Type</InputLabel>
                                <Select
                                    labelId="entity-type-select-label"
                                    id="eneity-type-select"
                                    value={curEntityName}
                                    label="Entity Type"
                                    onChange={(e) => {
                                        setCurEntityName(e.target.value);

                                        if (onEntityTypeSelected) onEntityTypeSelected(e.target.value);
                                    }}
                                >
                                    {entityTypes.map((val) => {
                                        return <MenuItem key={val + '-menuItem'} value={val}>{val}</MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                        </ListItem>
                        <ListItem>
                            <FormControl size="small" fullWidth>
                                <InputLabel id="entity-placement-select-label">Placement</InputLabel>
                                <Select
                                    labelId="entity-placement-select-label"
                                    id="eneity-placement"
                                    value={curEntityPlacementType}
                                    label="Placement"
                                    onChange={(e) => {
                                        setCurEntityPlacementType(e.target.value);

                                        if (onEntityPlacementTypeSelected) onEntityPlacementTypeSelected(e.target.value);
                                    }}
                                >
                                    {entityPlacementTypes.map((val) => {
                                        return <MenuItem value={val}>{val}</MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                        </ListItem>
                    </List>
                </Collapse>
                {numEntitiesOnMap !== undefined && numEntitiesOnMap > 0 && 
                <ListItemButton sx={{ flexFlow: 'row-reverse', mr: 2 }} onClick={() => {
                    setRemoveOpen(!removeOpen);
                }}>
                    <ListItemText primary={"Remove"} />
                    <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                        {removeOpen ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    </ListItemIcon>
                </ListItemButton>}
            </List>
            <Snackbar
                open={removeTipOpen}
                onClose={handleRemoveTipClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                key={"bottom" + "left" + "remove"}
                TransitionComponent={SlideTransition}
            >
                <Alert severity="info" onClose={handleRemoveTipClose} action={<IconButton
                    size="medium"
                    aria-label="close"
                    color="inherit"
                    onClick={handleRemoveTipClose}

                >
                    <CloseIcon fontSize="medium" />
                </IconButton>}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                            Right click on an Entity to remove it.
                        </Typography>
                    </Box>
                </Alert>
            </Snackbar>
        </>
    )
}