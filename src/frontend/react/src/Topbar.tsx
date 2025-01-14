import Badge from "@mui/material/Badge";
import { useEffect, useState } from "react";
import { navigate } from "wouter/use-location";
import NotifList from "./NotifList.tsx";
import { useApi } from "./apiStore.tsx";
import { usecollapseSidebar } from "./collapseSidebar.tsx";
import { domain } from "./util.ts";

const Topbar = () => {
  const { setOpen, isOpen } = usecollapseSidebar();
  const { user, image, friendreq, auth, setInfo } = useApi();
  const [isVisibleNotif, setIsVisibleNotif] = useState(false);

  const handleClickNotif = () => {
    setIsVisibleNotif(!isVisibleNotif);
  };

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const handleClickLogout = () => {
    if (token !== undefined) {
      document.cookie = `${"token"}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
      navigate("/login");
    }
  };

  useEffect(() => {}, [auth, friendreq, setInfo]);

  return (
    <div id="content">
      <div className="topbar">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="full">
            <div
              id="sidebarCollapse"
              className="sidebar_toggle special-button"
              onClick={() => setOpen(!isOpen)}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                }
              }}
            >
              <i className="fa fa-bars"></i>
            </div>
            <div className="logo_section">
              {/* <a href="#Profile">
					<img className="img-responsive" src={image} alt="#" />
				</a> */}
            </div>
            <div className="right_topbar">
              <div className="icon_info">
                <ul>
                  <li className="icons_list">
                    <i
                      onClick={handleClickLogout}
                      className="fa fa-power-off"
                    ></i>
                  </li>
                  <li className="icons_list">
                    <Badge
                      badgeContent={friendreq}
                      color="error"
                      style={{ height: `30px` }}
                    />
                    <i onClick={handleClickNotif} className="fa fa-bell"></i>
                    {isVisibleNotif && <NotifList />}
                  </li>
                  <li className="user_list">
                    <img
                      className="img-responsive "
                      style={{ width: 30 }}
                      src={image}
                      alt="#"
                    />
                  </li>
                  <li className="user_list">
                    <a>
                      <span className="name_user">{user}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Topbar;
