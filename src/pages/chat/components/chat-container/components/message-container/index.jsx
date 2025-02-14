import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES, HOST } from "@/utils/constants";
import moment from "moment";
import { useRef, useEffect } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { getColor } from "@/lib/utils";

const MessageContainer = () => {
  const scrollRef = useRef();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
    setIsDownloading,
    setFileDownloadProgress,
  } = useAppStore();

  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );

        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (e) {
        console.log(e);
      }
    };

    const getChannelMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_CHANNEL_MESSAGES}/${selectedChatData._id}`,
          { withCredentials: true }
        );

        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  const checkIfImage = (filePath) => {
    if (!filePath || typeof filePath !== "string") return false;
    const imageRegex = /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
    // console.log(filePath);
    return imageRegex.test(filePath);
  };

  const renderMessages = () => {
    // console.log("Rendering messages for: ", selectedChatType);
    let lastDate = null;
    return selectedChatMessages.map((message) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      // console.log("render message called");
      lastDate = messageDate;
      return (
        <div key={message._id}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
          {selectedChatType === "channel" && renderChannelMessages(message)}
        </div>
      );
    });
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    const response = await apiClient.get(`${HOST}${url}`,
      {
        responseType: "blob",
        onDownloadProgress: (ProgressEvent) => {
          const { loaded, total } = ProgressEvent;
          const percentCompleted = Math.round((loaded / total) * 100);
          setFileDownloadProgress(percentCompleted);
        }
      });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };

  const renderDMMessages = (message) => (
    <div className={`${message.sender === selectedChatData._id ? "text-left" : "text-right"}`}>
      {message.messageType === "text" && (
        <div
          className={`${message.sender !== selectedChatData._id
            ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
            : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {message.content}
        </div>
      )}
      {message.messageType === "file" && (
        <div
          className={`${message.sender !== selectedChatData._id
            ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
            : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {checkIfImage(message.fileURL) ? (
            <div className="cursor-pointer" onClick={() => {
              setShowImage(true);
              setImageURL(message.fileURL);
            }}>
              <img
                src={`${HOST}${message.fileURL}`}
                alt="Image not working haha"
                height={300}
                width={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <span className="text-white/8-text-3xl bg-black/20 rounded-full p-3">
                <MdFolderZip />
              </span>
              <span>{message.fileURL.split('/').pop()}</span>
              <span
                className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                onClick={() => downloadFile(message.fileURL)}>
                <IoMdArrowRoundDown />
              </span>
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-gray-600">{moment(message.timestamp).format("LT")}</div>
    </div>
  );

  const renderChannelMessages = (message) => {
    console.log(message.content);
    return (
      <div
        className={`mt-5 ${message.sender._id !== userInfo.id ? "text-left" : "text-right"}`
        }>
        {message.messageType === "text" && (
          <div
            className={`${message.sender._id !== userInfo.id
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
              } border inline-block p-4 rounded my-1 max-w-[50%] break-words ml-8`}
          >
            {message.content}
          </div>
        )}
        {message.messageType === "file" && (
          <div
            className={`${message.sender._id === userInfo.id
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
              } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
          >
            {checkIfImage(message.fileURL) ? (
              <div className="cursor-pointer" onClick={() => {
                setShowImage(true);
                setImageURL(message.fileURL);
              }}>
                <img
                  src={`${HOST}${message.fileURL}`}
                  alt="Image not working haha"
                  height={300}
                  width={300}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-white/8-text-3xl bg-black/20 rounded-full p-3">
                  <MdFolderZip />
                </span>
                <span>{message.fileURL.split('/').pop()}</span>
                <span
                  className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileURL)}>
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}
          </div>
        )}
        {
          message.sender._id !== userInfo.id ? <div className="flex items-center justify-start gap-3">
            <Avatar className="h-8 w-8 rounded-full overflow-hidden">
              {message.sender.image && (
                <AvatarImage src={`${HOST}/${message.sender.image}`} alt="profile" className="object-cover w-full h-full bg-black rounded-full"
                />)}
              (<AvatarFallback className={`uppercase h-8 w-8 text-lg flex items-center justify-center rounded-full ${getColor(message.sender.color)}`}
              >
                {message.sender.firstName
                  ? message.sender.firstName.split("").shift()
                  : message.sender.email.split("").shift()}
              </AvatarFallback>)
            </Avatar>
            <span className="text-sm text-white/60">
              {`${message.sender.firstName} ${message.sender.lastName}`}
            </span>
            <span className="text-xs text-white/60">
              {moment(message.timestamp).format("LT")}
            </span>
          </div> :
            <div className="text-xs text-white/60 mt-1">
              {moment(message.timestamp).format("LT")}
            </div>
        }
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {renderMessages()}
      <div ref={scrollRef} />
      {
        showImage && (
          <div className="fixed z-[1000] top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center backdrop-blur-lg flex-col">
            <div>
              <img src={`${HOST}${imageURL}`}
                className="h-[80vh] w-full bg-cover"
              />
            </div>
            <div className="flex gap-5 fixed top-0 mt-5">
              <button className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                onClick={() => downloadFile(imageURL)}
              >
                <IoMdArrowRoundDown />
              </button>
              <button className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                onClick={() => {
                  setShowImage(false);
                  setImageURL(null);
                }}
              >
                <IoCloseSharp />
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default MessageContainer;
