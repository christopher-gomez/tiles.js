import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PhoneIcon from '@mui/icons-material/Phone';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Stack from '@mui/material/Stack';

function stringToColor(string: string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

function stringAvatar(name: string) {
    const hasSpace = name.includes(' ');
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: hasSpace ? `${name.split(' ')[0][0]}${name.split(' ')[1][0]}` : name,
    };
}

interface AvatarProps {
    names: Array<string>
}
export function BackgroundLetterAvatars({ names }: AvatarProps) {
    return (
        <Stack direction="row" spacing={2}>

        </Stack>
    );
}

export const NameAvatar = ({ name }: { name: string }) => {
    return (
        <Avatar {...stringAvatar(name)} key={name} />
    )
}

export default function AvatarTabs({ names }: AvatarProps) {
    const [value, setValue] = React.useState(-1);
    const [hovered, setHovered] = React.useState(false);

    const tabRef: React.RefObject<HTMLButtonElement> = React.useRef(null)

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const onPointerEnter = () => {
        setHovered(true);
    }

    const onPointerLeave = () => {
        setHovered(false);
    }

    React.useEffect(() => {
        if (tabRef.current) {
            tabRef.current.removeEventListener("pointerenter", onPointerEnter);
            tabRef.current.removeEventListener("pointerleave", onPointerLeave);
            tabRef.current.addEventListener("pointerenter", onPointerEnter);
            tabRef.current.addEventListener("pointerleave", onPointerLeave);
        }

        return () => {
            if (tabRef.current) {
                tabRef.current.removeEventListener("pointerenter", onPointerEnter);
                tabRef.current.removeEventListener("pointerleave", onPointerLeave);
            }
        }
    }, [tabRef])

    return (
        (<AvatarGroup aria-label="icon label tabs example" sx={{
            pointerEvents: "auto"
        }}>
            {names.map(name => (<Avatar {...stringAvatar(name)} key={name} />))}
        </AvatarGroup>)
    );
}