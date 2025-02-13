import { useEffect } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { navigate } from "wouter/use-location";
import AuthApi from "./ApiAuth.tsx";
import ApiData2faProvider from "./ApiData2faProvider.tsx";
import "./App.css";
import Website from "./Website.tsx";
import { useApi } from "./apiStore.tsx";
import { domain } from "./util.ts";

function App() {
  const { auth, setauth } = useApi();
  const [location] = useLocation();

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const token2fa = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token2fa="))
    ?.split("=")[1];

  useEffect(() => {
    if (token && token2fa) {
      console.debug("Both tokens");
      document.cookie = `${"token2fa"}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
      navigate("/");
    } else if (token2fa) {
      console.debug("Just 2fa token");

      <ApiData2faProvider />;
      navigate("/2fa");
    } else if (token) {
      console.debug("Just normal token");
      navigate(location);
      if (auth === false) {
        setauth(true);
      }
    } else {
      navigate("/login");
    }
  }, [token, token2fa, navigate, auth]);
  const handleButtonClick = () => {
    window.location.href = `http://${domain}:3000/auth/login`;
  };

  return (
    <Switch>
      <Route path="/login">
        <div className="background-image">
          <div className="centered-container">
            <div className="special-button" onClick={handleButtonClick}>
              LOGIN
            </div>
          </div>
        </div>
      </Route>
      <Route path="/2fa">
        {auth ? <Redirect to="/" /> : <AuthApi code="" />}
      </Route>
      <Route>{auth && <Website />}</Route>
    </Switch>
  );
}

export default App;
