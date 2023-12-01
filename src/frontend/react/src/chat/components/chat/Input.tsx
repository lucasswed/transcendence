import { useState } from "react";
import Play from "../../../assets/Play.png";
import { currentUsername, socketIoRef } from "../../../network/SocketConnection";

function validInput(str: string) {
   return str.length > 0;
}

const Input = () => {
  const [text, setText] = useState("");

  const sendSend = () => {
    if (validInput(text)) {
      socketIoRef.current.emit("messageToServer", { username: currentUsername, message: text , userImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAilBMVEUBAQEAAAD5+Pb////9/PosLCwmJSVHRkVWVVUxMDC7urr//vv49/alpaTw7+4PDw7q6ei1tbRaWlqFhYXf396SkpJPT09/f39ycnLn5uVjY2OwsLBra2va2tnR0dAjIyPDw8KdnZ0XFxc7Ojp3d3eXlpY5OTkWFRXS0tGLi4sdHR2AgIDIyMeqqakC8qudAAAGMklEQVR4nO2ca1uqTBSGgzVaOsj22NYI0w7urPz/f++dAVE0FiGHWvE+9/6wu5qBq9sHZnCAdXUFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA2zq8GhjAswGOHoddJ9epxvZ64hk7vjwzDW5cY1NOxV4frRBOPbRqLMLwlNxvld1Pdukw3mjjM9qbtRoLhrWIFH9L9GEMj6HiiDQsmyBlaQdmGRRNkDCNB0YaFE8w2jAUlG94UTjDTcC8o2DAnwU+CGYaJoFzDSxLMMDwIijW8KMHPhvR+aBJqmJPgW1b/M8OUoFDDnAQzBc8M04IyDcd8go/ZW5wY0t90k0TDnAQZwRPDU0GJhjkJ/uO2SRmeCQo0vOETZAVThueC8gzHvGDON9aDIT2fN0kzzEkw7yt5YvhZUJohn+Awdz97wwxBYYY5o2j+bmLDLEFZhjnn4BdbRoY0z2qSZJiT4FebWsNsQUmG5ROMDBlBQYZ8gsOvN+4SJyjHMGcULbB1l+65JimG/DxYRNC5nrBNnKD7vSvCd9UEcxhoTrBfaPuaDCsmmMMLt2daFdtBPYZ8gotqfs6AFSyWYE2GbIK6qmDlBOsx/IkER4X3UYMhfw5WFVxXT7AOQ9kJ1mAoPMHqhnyC02p+NSVY2ZBPsKpgTQlWNbwXn2BFQ/5iu7kEi070B6oYsglqOQlWMmQTbFDw4gSrGDaX4K7GBCsYstOErATLG85/IMGg1P5KGv6aBMsa8gmG1fxqT7CkYXMJ1jvIRJQx/E0JljLkp4nmBEsnWMbw+VclWMKwuQSDRgQvNmwuwYYELzVkBxm1rObHC+pqgpca+txjFq6nLiY9h3c4Qddl//Z5E6v6Q9awBCplyD3nbT467vb/uJE7M4IM76jlhubbabsN7YVjqw2j9YU2G8aX/i023K8Qtdcw+fLWWsPDGl9bDY9fv1tqmFpfaKdhegGllYYnK0RtNDxdAmuh4dkaX/sMzxdQWmf4aYWobYafl8BaZnj/+QG+Rgx99t14HvZDucQwaxGzEcPry3kK2JeEihtmJPjT7x+mYB8QLW6YvYjZIsN59h7aYuiyy9C/y7BD3LKxNyGmTUjlj4KGzqbH0HniWqRUbylo2BgwhGEBYNgwMIRhAWDYMDCEYQFg2DAwhGEBYNgwMKzDsMh6aXN8g2HAroZf+J5dOb7BsMcuh2+OnbrTqg+ocnyDYSG69HX9k3LAEIZ18b8zvJ+97It9b2db+wfMV9OPqFTd82w2m9wdSts9j8JwNUvVCzXtp4v9Qg2nySPOHYoaQtLmn33Df3+PNi7MN1GktVJ0fGHh2rSdvhch1HCoVFxL+YZUaKdUtQiWZG8lkuuFvnLJzjRrcskLQ4+Or+4tlWn7BYb/DsWznkmNHMeLCjTsNtE9qlfHWSmamQSN2cx2sqZxpTfzgZi2k7tuMg03lLzvvta0dhylksufe7I/Toi2toBUUsk10Co+NJdGj/Q6vWeZhrGHZaRtDTD/UDh5S3obiXScd1If+/5vyvXs/2NSS+f46wiZhiajXfyTOeau48PwNRpcA6XCpa99o/2hjvXBzEdgx9OpojvHV156zzINzbG5r2K6UNqWrR2QGTHtr5bK1aT8v1GT6iUbGMM3+9ybPbiNeeqCV6hh/3AH29uX0rpdmhhNmqFSo36o6SMyTGrX/4lHpmm02Uzbk/SATMMwiaenDiU2zGgS2FfLlPn51apMj4PmezSn2CcaVh8fZuP0iSjTcJicSmboSGa6TjSCxINsoM3ssNOHEdaPRtWhPYINrps+EUUaPqqkQNFf0gMz8FjLOemR04sHWd8+abIxx+3adupNo6SfyfUDi++mT0SRhk/mwmWxWAx3zkCbaeKWaDl58WwVQTONTPtLLz52A6O42A1WpLTXtRHui0ua8Td1Ioo0nJuRU2tNA2dFZkZ4WJhrUlL24nNmbMheoUaV3Xe2H2lF4UM0U+6D356sj4g0vO+PLP2xMxj17ZCzXvh+aOf8d9sS7JJ5cDwyDcNVdMUWjPr7X9/2RwPhhrUCQxjWBQzLI8XQXLE0tGcphleb3tedyu1ZiGFzFDEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqMp/vgjD4gdgQQoAAAAASUVORK5CYII="});
      setText("");
    }
  };

  return (
    <div className="input">
      <input
        id="input"
        type="text"
        placeholder="Type something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="send">
        <img src={Play} alt="" />
        <button onClick={() => sendSend()}>
          Send
        </button>
      </div>
    </div>
  );
};


export default Input;
