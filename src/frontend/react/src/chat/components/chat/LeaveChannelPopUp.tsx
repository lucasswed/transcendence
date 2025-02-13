import { navigate } from "wouter/use-location";
import { useApi } from "../../../apiStore";
import { domain } from "../../../util";
import { updateChatRooms } from "../../context/ChatContext";
import { ChatData } from "../sidebar/ChatInfo";

interface LeaveChannelProps {
  channelId: string;
  isVisible: boolean;
  handleClose: () => void;
  passSelectedChatData: (data: ChatData) => void;
}

const LeaveChannelPopUp: React.FC<LeaveChannelProps> = (
  props: LeaveChannelProps
) => {
  const { login } = useApi();

  const handleClickClose = () => {
    props.handleClose();
  };

  const handleClickYes = () => {
    const tk = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    fetch(`http://${domain}:3000/user/leave-room`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: login,
        roomId: props.channelId,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.text();
        return data ? JSON.parse(data) : null;
      })
      .then((data) => {
        if (!data) {
          console.log("No data received");
        }
      })
      .then(updateChatRooms)
      .then(() => {
        if (props.passSelectedChatData) {
          props.passSelectedChatData({
            id: "",
            name: "",
            image: "",
            type: "",
            status: 0,
          });
        }
      })
      .catch(() => {
        console.log("cu");
      });

    props.handleClose();
  };

  return (
    <div>
      {props.isVisible && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Leave Channel</h5>
                <button
                  type="button"
                  className="close"
                  onClick={handleClickClose}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Do you want to leave this channel?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleClickYes}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClickClose}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveChannelPopUp;
