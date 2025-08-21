import { useState, useEffect } from "react";
import SideChatBar from "../components/SideChatBar";
import ChatInterface from "../components/ChatInterface";
import { apiClient } from "../services/apiClient";
import Navbar from "../components/Navbar";

const Home = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Fetch chats once on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await apiClient.get("/chats");
        setChats(response.data || []);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };
    fetchChats();
  }, []);

  // Create a new chat
  const handleCreateChat = async () => {
    const defaultTitle = "New Chat";
    try {
      const response = await apiClient.post("/chats", { title: defaultTitle });
      setChats((prevChats) => [response.data, ...prevChats]);
      setActiveChatId(response.data.id);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // Rename a chat by ID
  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const response = await apiClient.put(`/chats/${chatId}`, null, {
        params: { title: newTitle },
      });
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? { ...chat, title: response.data.title || newTitle }
            : chat
        )
      );
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  // Delete a chat by ID
  const handleDeleteChat = async (chatId) => {
    try {
      const res = await apiClient.delete(`/chats/${chatId}`);
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    } catch (error) {}
  };

  const handleFileUploaded = async () => {
    try {
      const response = await apiClient.get("/chats");
      setChats(response.data || []);

      // If the active chat was updated, set it again
      if (activeChatId) {
        const updatedChat = response.data.find(
          (chat) => chat.id === activeChatId
        );
        if (updatedChat) {
          setActiveChatId(updatedChat.id);
        } else if (response.data.length > 0) {
          setActiveChatId(response.data[0].id);
        } else {
          setActiveChatId(null);
        }
      }
    } catch (error) {
      console.error("Failed to refresh chats after upload:", error);
    }
  };

  return (
    <div className="flex  h-screen overflow-hidden bg-gradient-theme">
      <SideChatBar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onCreateChat={handleCreateChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />
      <main className="flex-1 flex flex-col">
        <Navbar />
        <ChatInterface
          chat={chats.find((chat) => chat.id === activeChatId)}
          onFileUploaded={handleFileUploaded}
        />
      </main>
    </div>
  );
};

export default Home;
