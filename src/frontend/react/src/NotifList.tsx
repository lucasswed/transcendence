import { useEffect, useState } from "react";
import { navigate } from "wouter/use-location";
import Notif from "./Notif";
import { useApi } from "./apiStore";
import { domain } from "./util";

interface NotifListProps {}

interface FriendRequest {
  id: string;
  requestor_id: string;
  requestor_username: string;
  requestor_image: string;
}

const NotifList: React.FC<NotifListProps> = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const { setfriendreq, auth, setInfo, friendreq } = useApi();

  // console.log(token);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (token === undefined) return;

    fetch(`http://${domain}:3000/user/friend-requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data as FriendRequest[];
      })
      .then((data) => {
        // console.log("FR Return: ", data);
        const mappedRequests = data.map((request: any) => ({
          id: request.id,
          requestor_id: request.requestor.id,
          requestor_username: request.requestor.login,
          requestor_image: request.requestor.image,
        }));

        setFriendRequests([...mappedRequests]);
        setfriendreq(mappedRequests.length);
      })
      .catch((error) => console.error("Fetch error:", error));
  }, [auth, setInfo, setfriendreq, friendreq]);

  return (
    <div className="request-container">
      <ul className="request-list">
        {friendRequests.map((request: FriendRequest) => (
          <Notif
            key={request.requestor_id}
            requestor_id={request.requestor_id}
            requestor_image={request.requestor_image}
            requestor_username={request.requestor_username}
            id={request.id}
          ></Notif>
        ))}
      </ul>
    </div>
  );
};

export default NotifList;
