import * as React from "react";
import CountdownTimer from "../../Components/UI/CountdownTimer";

export default () => {
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    if (authCode) {
      window.opener.postMessage(
        { type: "auth_code", code: authCode },
        window.location.origin
      );
    } else {
      window.opener.postMessage(
        { type: "auth_error", error: "Authorization failed" },
        window.location.origin
      );
    }

    window.setTimeout(() => {
      window.close();
    }, 1100);
  }, []);

  return (
    <div>
      <h1>Success!</h1>
      <p>This window will now self destruct...</p>
      <CountdownTimer seconds={1} />
    </div>
  );
};
