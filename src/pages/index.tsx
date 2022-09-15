import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

/// component to get all messages using react-query
const Messages = () => {
  const { data: messages, isLoading } = trpc.useQuery([
    "guestbook.getAllMessagesAndNames",
  ]);

  if (isLoading) {
    return <div>Fetching messages ...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {messages?.map((msg, index) => {
        return (
          <div key={index}>
            <p>{msg.message}</p>
            <span>- {msg.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const Home = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="text-3xl pt-4 pb-2">🦁 andreaspappas.xyz - Guestbook</h1>

      <div className=" p-1 border-dashed border-2 border-gray-500 rounded-lg">
        <p className="text-green-500 p-2">
          Come and say hi 👋, || share some wisdom 📖, || share a joke 🃏 -
          surprise me!
        </p>
      </div>

      {session ? (
        <div className="pt-10">
          <p>Hi 👋 {session.user?.name}</p>

          <button
            onClick={() => signOut()}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
              Logout
            </span>
          </button>

          {/* Render names and messages when logged in */}
          <div className="pt-10 p-1 border-dashed border-2 border-gray-500 rounded-lg">
            <Messages />
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => signIn("discord")}
            className="relative inline-flex items-center justify-center mt-2 p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
              Login with Discord
            </span>
          </button>

          {/* Render names and messages when logged out as well */}
          <div className="pt-10 p-1 border-dashed border-2 border-gray-500 rounded-lg">
            <Messages />
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
