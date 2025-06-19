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
    <>
      {/* Inject style overrides for df-messenger */}
      <style>{`
        df-messenger {
          --df-messenger-bot-message: #f3e8ff; /* bot bubble background */
          --df-messenger-user-message: #d1c4e9; /* user bubble background */
          --df-messenger-chat-background-color: #f9f4ff; /* chat background */
          --df-messenger-font-color: #333;
          --df-messenger-input-placeholder-color: #6a1b9a;
          --df-messenger-button-titlebar-color: #7e57c2; /* header */
          --df-messenger-button-titlebar-font-color: #fff;
        }
      `}</style>

      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
        <df-messenger
          intent="WELCOME"
          chat-title="🧠 WellnessBot"
          agent-id="fa8dec2e-acf2-40f5-916a-eae9dace3c58"
          language-code="en"
          chat-icon="https://cdn-icons-png.flaticon.com/512/9171/9171503.png"
          wait-open
        ></df-messenger>
      </div>
    </>
  );
};

export default DialogflowChat;
