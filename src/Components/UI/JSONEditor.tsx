import { Box, Button, List, ListItem, TextField } from '@mui/material';
import React from 'react';
import JSONInput from 'react-json-editor-ajrm';

export default ({ metadata, onChange }: { metadata: { [key: string]: any }, onChange: (data: { [key: string]: any }) => void }) => {
    const [clickedLineKey, setClickedLineKey] = React.useState<string>(null);
    const [clickedLineEditVal, setClickedLineEditVal] = React.useState<{ key: string, value: any }>({ key: '', value: '' });

    const [addVal, setAddVal] = React.useState({ key: '', value: '' });

    React.useEffect(() => {
        if (clickedLineKey) {
            setClickedLineEditVal({ key: clickedLineKey, value: metadata[clickedLineKey] });
        } else {
            setClickedLineEditVal({ key: '', value: '' });
        }
    }, [clickedLineKey])

    return (
        <Box sx={{ width: '100%' }}>
            <List>
                <ListItem>{"{"}</ListItem>
                {Object.keys(metadata).map(key => {
                    if (clickedLineKey && clickedLineKey === key) {
                        return (
                            <ListItem sx={{ ml: 2, display: 'flex', flexFlow: 'column' }}>
                                <Box sx={{ width: '100%', display: 'flex', flexFlow: 'row', }}>
                                    <TextField
                                        sx={{ mr: 1 }}
                                        size="small"
                                        id="tyle-type-name-controlled"
                                        type="text"
                                        autoComplete='off'
                                        value={clickedLineEditVal.key}
                                        fullWidth={false}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            setClickedLineEditVal(s => ({ ...s, key: event.target.value }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        id="tyle-type-name-controlled"
                                        type="text"
                                        autoComplete='off'
                                        value={clickedLineEditVal.value}
                                        fullWidth={false}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            setClickedLineEditVal(s => ({ ...s, value: event.target.value }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                </Box>


                                <Box sx={{ width: '100%', display: 'flex', flexFlow: 'row', mt: 1, mb: 1 }}>
                                    {(clickedLineEditVal.key !== clickedLineKey || clickedLineEditVal.value !== metadata[clickedLineKey]) && <Button sx={{ pl: 0 }} onClick={(() => {
                                        let data = { ...metadata };
                                        delete data[clickedLineKey];
                                        data[clickedLineEditVal.key] = clickedLineEditVal.value;
                                        onChange(data);
                                        setClickedLineKey(null);
                                    })}>Save</Button>}
                                    <Button sx={(clickedLineEditVal.key !== clickedLineKey || clickedLineEditVal.value !== metadata[clickedLineKey]) ? {} : { pl: 0 }} onClick={() => {
                                        setClickedLineKey(null);
                                    }}>Cancel</Button>
                                </Box>
                            </ListItem>
                        )
                    } else {
                        return (
                            <ListItem sx={{ ml: 2 }} onClick={() => setClickedLineKey(key)}>
                                {key}: {metadata[key]},
                            </ListItem>
                        )
                    }

                })}
                <ListItem>{"}"}</ListItem>
            </List>
            <Box sx={{ width: '100%', mt: 1 }}>Add Data</Box>
            <Box sx={{ width: '100%', display: 'flex', flexFlow: 'row', mt: 1 }}>
                <TextField
                    label={"Key"}
                    sx={{ mr: 1 }}
                    size="small"
                    id="tyle-type-name-controlled"
                    type="text"
                    autoComplete='off'
                    value={addVal.key}
                    fullWidth={false}
                    variant='standard'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setAddVal(s => ({ ...s, key: event.target.value }));
                        // if (onMapSizeChanged) onMapSizeChanged(val);
                    }}
                />
                <TextField
                    label={"Value"}
                    size="small"
                    id="tyle-type-name-controlled"
                    type="text"
                    autoComplete='off'
                    value={addVal.value}
                    fullWidth={false}
                    variant='standard'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setAddVal(s => ({ ...s, value: event.target.value }));
                        // if (onMapSizeChanged) onMapSizeChanged(val);
                    }}
                />
                {(addVal.key && addVal.key.length > 0 && addVal.value && addVal.value.length > 0) &&
                    <Button disabled={(addVal.key in metadata)} onClick={(() => {
                        let data = { ...metadata };
                        data[addVal.key] = addVal.value;
                        onChange(data);
                        setAddVal({ key: '', value: '' });
                    })}>Add</Button>}
            </Box>
        </Box >
    );
};
