import React from "react";
import "../../styles/sandbox.css";
import Box from "@mui/material/Box";
import { Typography, Button, IconButton, Slide } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddRoadIcon from "@mui/icons-material/AddRoad";
import CottageIcon from "@mui/icons-material/Cottage";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import { Player, Resources } from "../CatanHelpers";
import IconButtonTray from "../../UI/IconButtonTray";

import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import ConstructionIcon from "@mui/icons-material/Construction";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PerspectiveHoverEffectUI from "../../UI/PerspectiveHoverEffectUI";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CasinoIcon from "@mui/icons-material/Casino";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
// const useStyles = makeStyles((theme) => ({
//     disabledAction: {
//       color: "rgba(0, 0, 0, 0.5)",
//       boxShadow: "none",
//       backgroundColor: "rgba(0, 0, 0, 0.6)",
//     },
//   }));

const StyledSpeedDialAction = styled(SpeedDialAction)(({ theme }) => ({
  "&.Mui-disabled": {
    color: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    boxShadow: "none",
    cursor: "not-allowed !important",
    pointerEvents: "auto !important",
  },
}));

export interface IActionMenuBuildProps {
  canBuildSettlement: boolean;
  canBuildRoad: boolean;
  canBuildCity: boolean;
  onSettlementDragged: (cb: () => void) => void;
  onRoadDragged: (cb: () => void) => void;
  onCityDragged: (cb: () => void) => void;
  availableRoads: number;
  availableSettlements: number;
  availableCities: number;
  roadCost: JSX.Element;
  settlementCost: JSX.Element;
  cityCost: JSX.Element;
}

export const ActionsMenu = ({
  canBuild,
  canTrade,
  canDCard,
  buildTrayProps,
  fabState,
  diceRollProps,
  canEndTurn,
  onEndTurn,
}: {
  fabState: "Actions" | "Roll" | "Roll Spectate" | "None";
  canEndTurn: boolean;
  onEndTurn: () => void;
  canBuild: boolean;
  canTrade: boolean;
  canDCard: boolean;
  buildTrayProps: IActionMenuBuildProps;
  diceRollProps: {
    diceRolled: boolean;
    onClick: () => void;
    diceVal: number;
  };
}) => {
  const [buildOpen, setBuildOpen] = React.useState(false);

  const actions = [
    {
      icon: <ConstructionIcon />,
      name: "Build",
      enabled: canBuild,
      action: () => setBuildOpen(true),
    },
    {
      icon: <HandshakeIcon />,
      name: "Trade",
      enabled: canTrade,
      action: () => {},
    },
    {
      icon: <RecentActorsIcon />,
      name: "Development Cards",
      enabled: canDCard,
      action: () => {},
    },
    {
      icon: <TrendingFlatIcon />,
      name: "End Turn",
      enabled: canEndTurn,
      action: onEndTurn,
    },
  ];

  if (fabState === "None") return null;

  const fabRef = React.useRef(null);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          transition: "all 1s linear",
          position: "absolute",
          bottom: 0,
          left: 0,
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        {(fabState === "Roll" || fabState === "Roll Spectate") && (
          <Slide
            direction="up"
            in={diceRollProps.diceRolled}
            mountOnEnter
            unmountOnExit
            container={fabRef.current}
          >
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                textShadow:
                  "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black",
              }}
            >
              {diceRollProps.diceVal}
            </Typography>
          </Slide>
        )}
        {(fabState === "Actions" || fabState == "Roll") && (
          <PerspectiveHoverEffectUI
            rotateX={false}
            rotateY={false}
            translate={75}
          >
            <SpeedDial
              ref={fabRef}
              open={fabState === "Actions" && !buildOpen}
              onClick={() => {
                if (fabState === "Actions") {
                  if (buildOpen) setBuildOpen(false);
                } else if (fabState === "Roll") {
                  diceRollProps.onClick();
                }
              }}
              FabProps={{
                sx: {
                  backgroundColor: "black",
                  ":hover": { backgroundColor: "black !important" },
                  display: (diceRollProps.diceRolled) ? 'none' : 'inherit'
                },
              }}
              ariaLabel="SpeedDial openIcon example"
              sx={{
                color: "white !important",
                alignItems: "center",
              }}
              icon={
                <SpeedDialIcon
                  openIcon={<WorkspacesIcon />}
                  icon={
                    fabState === "Roll" ? (
                      <CasinoIcon />
                    ) : fabState === "Actions" ? (
                      buildOpen ? (
                        <CloseIcon />
                      ) : undefined
                    ) : undefined
                  }
                />
              }
            >
              {actions.map((action, i) => (
                <StyledSpeedDialAction
                  sx={{
                    backgroundColor: "black",
                    color: "white",
                    ":hover": {
                      color: action.enabled
                        ? "black"
                        : "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  FabProps={{
                    disabled: !action.enabled,
                    size: action.enabled ? "medium" : "small",
                  }}
                  onClick={() => {
                    if (action.enabled) action.action();
                  }}
                />
              ))}
            </SpeedDial>
          </PerspectiveHoverEffectUI>
        )}
      </Box>
      <div
        style={{
          width: "100%",
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          display: "flex",
          flexFlow: "row",
          justifyContent: "center",
        }}
      >
        <BuildingTray {...buildTrayProps} open={buildOpen} />
      </div>
    </>
  );
};

export const ResourceDisplay = ({
  lumber,
  grain,
  wool,
  brick,
  ore,
}: {
  lumber?: number;
  grain?: number;
  wool?: number;
  brick?: number;
  ore?: number;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "row",
        p: 1,
        pb: 0.5,
        pr: 2,
        ">*": { ml: 1 },
        textAlign: "left",
        background: "rgba(0,0,0,.25)",
        backdropFilter: "blur(5px)",
      }}
    >
      {brick !== undefined && (
        <Box sx={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
          <Typography>{Resources.BRICK}</Typography>
          <Typography>{brick}</Typography>
        </Box>
      )}
      {lumber !== undefined && (
        <Box sx={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
          <Typography>{Resources.LUMBER}</Typography>
          <Typography>{lumber}</Typography>
        </Box>
      )}
      {wool !== undefined && (
        <Box sx={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
          <Typography>{Resources.WOOL}</Typography>
          <Typography>{wool}</Typography>
        </Box>
      )}
      {grain !== undefined && (
        <Box sx={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
          <Typography>{Resources.GRAIN}</Typography>
          <Typography>{grain}</Typography>
        </Box>
      )}
      {ore !== undefined && (
        <Box sx={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
          <Typography>{Resources.ORE}</Typography>
          <Typography>{ore}</Typography>
        </Box>
      )}
    </Box>
  );
};

export interface IBuildingTrayProps {
  canBuildSettlement: boolean;
  canBuildRoad: boolean;
  canBuildCity: boolean;
  onSettlementDragged: (cb: () => void) => void;
  onRoadDragged: (cb: () => void) => void;
  onCityDragged: (cb: () => void) => void;
  availableRoads: number;
  availableSettlements: number;
  availableCities: number;
  roadCost: JSX.Element;
  settlementCost: JSX.Element;
  cityCost: JSX.Element;
  open: boolean;
}

export const BuildingTray = ({
  canBuildSettlement,
  canBuildRoad,
  canBuildCity,
  onSettlementDragged,
  onRoadDragged,
  onCityDragged,
  availableRoads,
  availableSettlements,
  availableCities,
  roadCost,
  settlementCost,
  cityCost,
  open,
}: IBuildingTrayProps) => {
  const [selectingSettlement, setSelectingSettlement] = React.useState(false);
  const [selectingRoad, setSelectingRoad] = React.useState(false);
  const [selectingCity, setSelectingCity] = React.useState(false);

  const [dragging, setDragging] = React.useState(false);

  return (
    <IconButtonTray
      sx={{
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(5px)",
        opacity: dragging ? 0.5 : 1,
        borderRadius: "2em 2em 0 0",
        transform: open ? "translateY(0)" : "translateY(1000px)",
        transition: "transform .5s",
        paddingBottom: 0,
      }}
      tips={[
        { title: "Road", body: roadCost },
        { title: "Settlement", body: settlementCost },
        { title: "City", body: cityCost },
      ]}
      actions={[
        {
          icon: <AddRoadIcon />,
          title: availableRoads,
          onPointerDown: () => setSelectingRoad(true),
          onPointerUp: () => setSelectingRoad(false),
          disabled: !canBuildRoad,
        },
        {
          icon: <CottageIcon />,
          title: availableSettlements,
          onPointerDown: () => setSelectingSettlement(true),
          onPointerUp: () => setSelectingSettlement(false),
          disabled: !canBuildSettlement,
        },
        {
          icon: <LocationCityIcon />,
          title: availableCities,
          onPointerDown: () => setSelectingCity(true),
          onPointerUp: () => setSelectingCity(false),
          disabled: !canBuildCity,
        },
      ]}
      onPointerLeave={() => {
        if (selectingSettlement) {
          setDragging(true);
          onSettlementDragged(() => setDragging(false));
        } else if (selectingRoad) {
          setDragging(true);
          onRoadDragged(() => setDragging(false));
        } else if (selectingCity) {
          setDragging(true);
          onCityDragged(() => setDragging(false));
        }
        setSelectingRoad(false);
        setSelectingSettlement(false);
        setSelectingCity(false);
      }}
    />
  );
};

const TraderResource = ({
  name,
  available,
  onAmountChange,
  displayTotal,
  tradeRatio,
}: {
  name: string;
  available?: number;
  onAmountChange: (amount: number) => void;
  displayTotal: boolean;
  tradeRatio?: string;
}) => {
  const [amount, setAmount] = React.useState(0);

  React.useEffect(() => {
    onAmountChange(amount);
  }, [amount]);

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", flexFlow: "column" }}>
        <Box sx={{ display: "flex", flexFlow: "row" }}>
          <IconButton
            disabled={amount === 0}
            size="large"
            aria-label="less"
            onClick={() => {
              let nextAmount = amount - 1;
              if (nextAmount < 0) nextAmount = 0;

              setAmount(nextAmount);
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ display: "flex", alignItems: "center" }}>
            {amount}
          </Typography>
          <IconButton
            disabled={amount === available}
            size="large"
            aria-label="more"
            onClick={() => {
              let nextAmount = amount + 1;

              if (nextAmount > available) nextAmount = available;

              setAmount(nextAmount);
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Typography sx={{ textAlign: "center" }}>{name}</Typography>
        {displayTotal && (
          <Typography
            sx={{ textAlign: "center", color: "gray", fontSize: ".8rem" }}
          >
            Available: {available}
          </Typography>
        )}
        {tradeRatio && (
          <Typography
            sx={{ textAlign: "center", color: "gray", fontSize: ".8rem" }}
          >
            {tradeRatio}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export const ResourceTrader = ({
  brick,
  lumber,
  wool,
  grain,
  ore,
  isBank,
  isBilateral,
  specialDeal,
  onValid,
  onInValid,
}: {
  brick?: number;
  lumber?: number;
  wool?: number;
  grain?: number;
  ore?: number;
  isBilateral?: boolean;
  isBank?: boolean;
  specialDeal?: Array<{
    resourceOffered: { name: string; amountNeeded: number };
    resourceReceived: { name: string; amountReceived: number };
  }>;
  onValid?: (finalResourcesTrading: {
    resourcesOffering: Array<{ name: string; amount: number }>;
    resourcesReceiving: Array<{ name: string; amount: number }>;
    leftovers: Array<{ name: string; amount: number }>;
  }) => void;
  onInValid?: () => void;
}) => {
  const [isValid, setIsValid] = React.useState(false);

  const [traderOffer, setTraderOffer] = React.useState<
    Array<{ name: string; amount: number }>
  >([]);
  const [tradeeOffer, setTradeeOffer] = React.useState<
    Array<{ name: string; amount: number }>
  >([]);

  const [finalResourcesTrading, setFinalResourcesTrading] = React.useState<{
    resourcesOffering: Array<{ name: string; amount: number }>;
    resourcesReceiving: Array<{ name: string; amount: number }>;
    leftovers: Array<{ name: string; amount: number }>;
  }>({ resourcesOffering: [], resourcesReceiving: [], leftovers: [] });

  React.useEffect(() => {
    if (tradeeOffer.length === 0 || traderOffer.length === 0) {
      setIsValid(false);
      return;
    }

    let totalReceived = [
      ...tradeeOffer
        .filter((r) => r.amount > 0)
        .map((r) => ({ name: r.name, amount: r.amount })),
    ];
    let totalOffered = [
      ...traderOffer
        .filter((r) => r.amount > 0)
        .map((r) => ({ name: r.name, amount: r.amount })),
    ];

    if (
      totalReceived.length > 0 &&
      totalReceived.map((r) => r.amount).reduce((a, b) => a + b) > 0
    ) {
      let valid = false;

      let accountedForOffers: { name: string; amount: number }[] = [];
      let accountedForReceives: { name: string; amount: number }[] = [];

      const checkResources = (
        received: Array<{ name: string; amount: number }>,
        offered: Array<{ name: string; amount: number }>
      ) => {
        let valid = true;
        for (const desired of received) {
          let foundValid = false;
          let deltaNeed = isBank ? 4 : 1;

          for (let i = 0; i < desired.amount; i++) {
            let amountOfSameType = 0;
            let amountWanted = 1;

            let _foundValid = false;
            for (const offer of offered) {
              if (offer.name === desired.name) continue;

              if (
                isBank &&
                specialDeal !== undefined &&
                specialDeal.find(
                  (r) =>
                    r.resourceOffered.name === offer.name ||
                    r.resourceOffered.name === "Wild"
                ) &&
                specialDeal.find(
                  (r) =>
                    r.resourceReceived.name === desired.name ||
                    r.resourceReceived.name === "Any"
                )
              ) {
                deltaNeed = specialDeal.find(
                  (r) =>
                    r.resourceOffered.name === offer.name ||
                    r.resourceOffered.name === "Wild"
                ).resourceOffered.amountNeeded;
              }

              if (offer.amount >= deltaNeed) {
                let amount = offer.amount;

                let amountTrading = 0;
                for (let j = 0; j < offer.amount; j += deltaNeed) {
                  amountTrading += deltaNeed;
                  amount -= deltaNeed;

                  if (amountTrading >= amountWanted * deltaNeed) break;
                }

                amountOfSameType += amountTrading;

                offered[offered.findIndex((r) => r.name === offer.name)] = {
                  name: offer.name,
                  amount: amount,
                };

                let totalI = totalOffered.findIndex(
                  (r) => r.name === offer.name
                );
                totalOffered[totalI].amount -= amountTrading;

                let validI = accountedForOffers.findIndex(
                  (r) => r.name === offer.name
                );
                if (validI !== -1) {
                  accountedForOffers[validI].amount += amountTrading;
                } else {
                  accountedForOffers.push({
                    name: offer.name,
                    amount: amountTrading,
                  });
                }

                if (amountOfSameType >= amountWanted * deltaNeed) {
                  _foundValid = true;
                  let validR = accountedForReceives.findIndex(
                    (r) => r.name === desired.name
                  );
                  if (validR !== -1) {
                    accountedForReceives[validR].amount += 1;
                  } else {
                    accountedForReceives.push({
                      name: desired.name,
                      amount: 1,
                    });
                  }
                }

                break;
              }
            }

            if (!_foundValid) {
              continue;
            } else {
              if (i === desired.amount - 1) {
                foundValid = true;
              }
            }
          }

          if (!foundValid) {
            valid = false;
            accountedForOffers = [];
            break;
          }
        }

        return valid;
      };

      if (specialDeal !== undefined) {
        const specialReceives = totalReceived.filter((r) =>
          specialDeal.find(
            (_r) =>
              _r.resourceReceived.name === r.name ||
              _r.resourceReceived.name === "Any"
          )
        );
        const specialOffers = totalOffered.filter((r) =>
          specialDeal.find((_r) => _r.resourceOffered.name === r.name)
        );

        valid = checkResources(specialReceives, specialOffers);
      }

      const receivingResources = totalReceived.filter(
        (r) => !accountedForReceives.find((_r) => _r.name === r.name)
      );
      const offeringResources = totalOffered.filter((r) => r.amount > 0);

      if (receivingResources.length > 0)
        valid = checkResources(receivingResources, offeringResources);

      let leftovers: { name: string; amount: number }[] = [];
      if (valid) {
        leftovers = totalOffered.filter((r) => r.amount > 0);
      }

      setFinalResourcesTrading({
        resourcesOffering: accountedForOffers,
        leftovers: leftovers,
        resourcesReceiving: accountedForReceives,
      });
      setIsValid(valid);
    } else {
      setIsValid(false);
      setFinalResourcesTrading({
        resourcesOffering: [],
        leftovers: [],
        resourcesReceiving: [],
      });
    }
  }, [tradeeOffer, traderOffer]);

  React.useEffect(() => {
    if (isValid) {
      if (onValid) onValid(finalResourcesTrading);
    } else {
      if (onInValid) onInValid();
    }
  }, [isValid]);

  const resourcesAvailableToTrade: Array<{ name: string; available: number }> =
    [];

  const bankResources: Array<{ name: string; available: number }> = [
    { name: Resources.BRICK, available: Number.MAX_VALUE },
    { name: Resources.LUMBER, available: Number.MAX_VALUE },
    { name: Resources.WOOL, available: Number.MAX_VALUE },
    { name: Resources.GRAIN, available: Number.MAX_VALUE },
    { name: Resources.ORE, available: Number.MAX_VALUE },
  ];

  if (brick !== undefined)
    resourcesAvailableToTrade.push({ name: Resources.BRICK, available: brick });
  if (lumber !== undefined)
    resourcesAvailableToTrade.push({
      name: Resources.LUMBER,
      available: lumber,
    });
  if (wool !== undefined)
    resourcesAvailableToTrade.push({ name: Resources.WOOL, available: wool });
  if (grain !== undefined)
    resourcesAvailableToTrade.push({ name: Resources.GRAIN, available: grain });
  if (ore !== undefined)
    resourcesAvailableToTrade.push({ name: Resources.ORE, available: ore });

  return (
    <Box>
      {isBank && (
        <Box sx={{ display: "flex", flexFlow: "column", mb: 2 }}>
          <Typography sx={{ fontStyle: "italic" }}>Receiving</Typography>
          <hr
            style={{
              justifySelf: "flex-start !important",
              display: "flex",
              width: "100%",
              marginTop: "8px",
              marginBottom: "16px",
            }}
          />
          <Box sx={{ display: "flex", flexFlow: "row" }}>
            {bankResources.map((resource) => (
              <TraderResource
                displayTotal={false}
                name={resource.name}
                available={resource.available}
                onAmountChange={(amt) => {
                  if (tradeeOffer.find((r) => r.name === resource.name)) {
                    const i = tradeeOffer.findIndex(
                      (r) => r.name === resource.name
                    );
                    const r = tradeeOffer[i];
                    r.amount = amt;

                    setTradeeOffer([...tradeeOffer]);
                  } else {
                    setTradeeOffer((s) => [
                      ...s,
                      { name: resource.name, amount: amt },
                    ]);
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      <Box sx={{ display: "flex", flexFlow: "column" }}>
        <Typography sx={{ fontStyle: "italic" }}>Offering</Typography>
        <hr
          style={{
            justifySelf: "flex-start !important",
            display: "flex",
            width: "100%",
            marginTop: "8px",
            marginBottom: "16px",
          }}
        />
        <Box sx={{ display: "flex", flexFlow: "row" }}>
          {resourcesAvailableToTrade.map((resource) => (
            <TraderResource
              displayTotal
              name={resource.name}
              available={resource.available}
              onAmountChange={(amt) => {
                if (traderOffer.find((r) => r.name === resource.name)) {
                  const i = traderOffer.findIndex(
                    (r) => r.name === resource.name
                  );
                  const r = traderOffer[i];
                  r.amount = amt;

                  setTraderOffer([...traderOffer]);
                } else {
                  setTraderOffer((s) => [
                    ...s,
                    { name: resource.name, amount: amt },
                  ]);
                }
              }}
              tradeRatio={
                specialDeal.find(
                  (x) => x.resourceOffered.name === resource.name
                )
                  ? specialDeal.find(
                      (x) => x.resourceOffered.name === resource.name
                    ).resourceOffered.amountNeeded +
                    ":" +
                    specialDeal.find(
                      (x) =>
                        x.resourceReceived.name === resource.name ||
                        x.resourceReceived.name === "Any"
                    ).resourceReceived.amountReceived
                  : specialDeal.find((x) => x.resourceOffered.name === "Wild")
                  ? "3:1"
                  : "4:1"
              }
            />
          ))}
        </Box>
      </Box>
      {/* <Box sx={{ display: 'flex', flexFlow: 'row', justifyContent: 'flex-end', p: 1, mt: 1 }}>
                <Button disabled={!isValid || tradeeOffer.length === 0 || traderOffer.length === 0}>Trade</Button>
                <Button>Cancel</Button>
            </Box> */}
    </Box>
  );
};

export const LighthouseInfoBubble = ({
  position,
  showBubble,
  resourceType,
  amountNeeded,
}) => {
  let resource = "?";

  switch (resourceType) {
    case Resources.LUMBER:
      resource = "Lumber";
      break;
    case Resources.BRICK:
      resource = "Brick";
      break;
    case Resources.GRAIN:
      resource = "Grain";
      break;
    case Resources.WOOL:
      resource = "Wool";
      break;
    case Resources.ORE:
      resource = "Ore";
      break;
    case Resources.WILD:
      resource = "Wild";
      break;
  }
  return (
    <div
      className="lighthouse-info-bubble"
      style={{
        display: showBubble ? "block" : "none",
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: "rgba(255, 255, 255, 0.5)", // RGBA color with alpha (0.8 for 80% opacity)
        border: "1px solid black",
        borderRadius: "1em",
        padding: ".5em 1.5em",
        backdropFilter: "blur(5px)", // Add a blur effect with 5px radius
        fontWeight: "bolder",
      }}
    >
      {/* Add your bubble content here */}
      <div className="bubble-content">
        <h4 style={{ margin: "0 0" }}>Sea Trade</h4>
        <p style={{ margin: "5px 0 0" }}>
          <small>Resource</small>
        </p>
        <p style={{ margin: "0 0" }}>{resource}</p>
        <p style={{ margin: "5px 0 0" }}>{amountNeeded} : 1</p>
      </div>
    </div>
  );
};
