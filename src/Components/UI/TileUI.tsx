import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tile from "../../lib/map/Tile";



export default ({ tile, canvas, buttons }) => {
  const _tile = tile as Tile;
  const tileScreenPos = _tile.getTileScreenPosition();
  const tilePos = _tile.position;

  const screenPercent = {
    x: 0,
    y: 0,
  };

  screenPercent.x = (tileScreenPos.x / canvas.width) * 100;
  screenPercent.y = (tileScreenPos.y / canvas.height) * 100;

  const positionString = `(${Math.floor(tilePos.x)}, ${Math.floor(tilePos.z)})`;

  const card = (
    <React.Fragment>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {positionString}
        </Typography>
        <Typography variant="h5" component="div">
          Tile
        </Typography>
        <Typography sx={{}} color="text.secondary">
        </Typography>
      </CardContent>
      <CardActions sx={{
        display: "flex",
        flexFlow: "column",
      }}>
        {buttons.map(button => (<Button size="small" sx={{
          color: 'gray',
          '&:hover': {
            color: 'black'
          }

        }}
          onClick={() => {
            if (button.action) button.action();
          }}>
          {button.title}
        </Button>))}
      </CardActions>
    </React.Fragment>
  );

  const elemWidth = (150 / canvas.width) * 100;

  const ref = React.useRef(null);

  const [state, setState] = React.useState({ height: 0 });

  React.useEffect(() => {
    if (ref.current) {
      const height = (ref.current.offsetHeight / canvas.height) * 100;
      setState(s => ({ ...state, height: height }))
    }
  }, [ref])
  return (
    <Card
      ref={ref}
      sx={{
        backgroundColor: "rgba(255,255,255,.85)",
        position: "absolute",
        // left: `${pos}px`,
        left: `${screenPercent.x - (elemWidth + (elemWidth / 2) + .5)}%`,
        // top: `${height}px`,
        top: `${screenPercent.y - (state.height / 2)}%`,
        // transform: `translate(${posX}, ${posY})`,
        width: `${elemWidth}%`,
        opacity: state.height === 0 ? 0 : 1
      }}
      variant="outlined"
    >
      {card}
    </Card>
    // <div
    //   style={{
    //     position: "absolute",
    //     // left: `${pos}px`,
    //     left: `${screenPercent.x - 27}%`,
    //     // top: `${height}px`,
    //     top: `${screenPercent.y - 20}%`,
    //     // transform: `translate(${posX}, ${posY})`,
    //     width: "20%",
    //     height: "40%",
    //     backgroundColor: "white",
    //     display: "flex",
    //     flexFlow: "column",
    //   }}
    // >
    //   <p>Tile</p>
    //   <p>{positionString}</p>
    //   <button
    //     onClick={() => {
    //       if (onCancel) onCancel();
    //     }}
    //   >
    //     Cancel
    //   </button>
    // </div>
  );
};
