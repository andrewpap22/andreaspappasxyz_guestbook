import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
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
  const [message, setMessage] = useState("");
  const ctx = trpc.useContext();

  /**
   * Using the postMessage endpoint to post messages in the database.
   * Even though it works as expected, the user is not a able to see the message in the UI.
   * The message is only visible after a page refresh.
   * To solve that we use optimistic UI updates with react-query.
   * https://react-query-v3.tanstack.com/guides/optimistic-updates
   */
  const postMessage = trpc.useMutation("guestbook.postMessage", {
    onMutate: () => {
      ctx.cancelQuery(["guestbook.getAllMessagesAndNames"]);

      let optimisticUpdate = ctx.getQueryData([
        "guestbook.getAllMessagesAndNames",
      ]);
      if (optimisticUpdate) {
        ctx.setQueryData(
          ["guestbook.getAllMessagesAndNames"],
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      ctx.invalidateQueries(["guestbook.getAllMessagesAndNames"]);
    },
  });

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <>
      <header>
        <h1 className="text-3xl pt-4 pb-2 flex flex-col items-center">
          🦁 andreaspappas.xyz - Guestbook
        </h1>
      </header>
      <main className="flex flex-col items-center">
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
              className="relative inline-flex items-center justify-center mt-1 p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                Logout
              </span>
            </button>

            <div className="pt-6">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();

                  postMessage.mutate({
                    name: session.user?.name as string,
                    message,
                  });

                  setMessage("");
                }}
              >
                <input
                  type="text"
                  value={message}
                  placeholder="Enter your message here..."
                  maxLength={100}
                  onChange={(event) => setMessage(event.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-zinc-800 bg-neutral-900 focus:outline-none"
                />

                <button
                  type="submit"
                  className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
                >
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                    Submit
                  </span>
                </button>
              </form>
            </div>

            {/* Render names and messages when logged in */}
            <div className="pt-10">
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
            <div className="pt-10">
              <Messages />
            </div>
          </div>
        )}
      </main>
      <footer>
        <p className="text-center text-sm pt-4 pb-2">
          --- <a href="https://andreaspappas.xyz">andreaspappas.xyz</a> ©️2022.
          ---
        </p>
      </footer>
    </>
  );
};

export default Home;
