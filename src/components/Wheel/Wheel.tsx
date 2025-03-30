import React, { useEffect, useState } from "react";
import { Wheel } from "react-custom-roulette";

const data = [
  { option: "iPhone", optionSize: 10 },
  { option: "Smart TV", optionSize: 10 },
  { option: "Car", optionSize: 20 },
  // { option: "Hose" },
  // { option: "Computer" },
  // { option: "Travel" },
  // { option: "Free Store" },
  // { option: "Palabras cortas" },
  // { option: "Sin premio" },
];

const WheelRoulette = ({ newSpin }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const handleSpinClick = () => {
    const newPrizeNumber = Math.floor(Math.random() * data.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  useEffect(() => {
    if (newSpin) {
      handleSpinClick();
    }
  });

  return (
    <>
      <Wheel
        spinDuration={0.4}
        disableInitialAnimation={false}
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        // outerBorderColor={["#f2f2f2"]}
        // outerBorderWidth={[10]}
        // innerBorderColor={["#f2f2f2"]}
        // innerBorderWidth={[5]}
        // innerRadius={[10]}
        // innerRaidusColor={"black"}
        // innerBorderColor={["green"]}
        // radiusLineColor={["#dedede"]}
        // outerBorderColor={["black"]}
        radiusLineWidth={2}
        // radiusLineColor={"black"}
        innerRadius={10}
        fontSize={15}
        textColors={["#ffffff"]}
        backgroundColors={[
          "#F22B35",
          "#F99533",
          "#24CA69",
          "#514E50",
          "#46AEFF",
          "#9145B7",
        ]}
        onStopSpinning={() => {
          setMustSpin(false);
          console.log(data[prizeNumber]);
        }}
      />
      {/* <button onClick={handleSpinClick}>SPIN</button> */}
      {/* {!mustSpin ? data[prizeNumber].option : "0"} */}
    </>
  );
};

export default WheelRoulette;
