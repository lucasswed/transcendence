import React, { ReactNode, useEffect } from "react";
import { navigate } from "wouter/use-location";
import { useApi } from "./apiStore";
import { domain } from "./util";

interface ApiQrProps {
  children?: ReactNode;
}

const ApiQr: React.FC<ApiQrProps> = (props) => {
  const { setqrcode, auth } = useApi();
  useEffect(() => {}, [auth]);

  useEffect(() => {
    const fetchData = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (token === undefined) return;

      try {
        const response = await fetch(
          `http://${domain}:3000/auth/2fa/generate`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          navigate("/login");
          return;
        }

        const data = await response.json();
        setqrcode(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return <>{props.children}</>;
};

export default ApiQr;
