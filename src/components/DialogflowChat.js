import { useEffect } from "react";

const DialogflowChat = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <df-messenger
        intent="WELCOME"
        chat-title="Mental_Wellness_Companion"
        agent-id="fa8dec2e-acf2-40f5-916a-eae9dace3c58"
        language-code="en"
      ></df-messenger>
    </div>
  );
};

export default DialogflowChat;
