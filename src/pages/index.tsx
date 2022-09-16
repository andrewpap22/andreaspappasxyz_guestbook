import { useSession } from "next-auth/react";
import Image from "next/image";
import LoadingSpinner from "../components/loading";
import clsx from "clsx";
import AuthButtons, { LogOutButton } from "../components/authButtons";
import { useState } from "react";
import { trpc } from "../utils/trpc";

/// component to get all messages using react-query
const Messages = () => {
  const { data: messages, isLoading } = trpc.useQuery([
    "guestbook.getAllMessagesAndNames",
  ]);

  if (isLoading) {
    return (
      <div>
        <span className="flex flex-row justify-center content-center">
          Fetching messages... &nbsp; <LoadingSpinner />
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages?.map((msg, index) => {
        return (
          <div key={index}>
            <p className="text-lg">{msg.message}</p>
            <span className="text-gray-500">
              - <span className="text-gray-300">{msg.name}</span> &nbsp; /
              &nbsp; {msg.createdAt.toString().split(" ").slice(0, 5).join(" ")}{" "}
              {/** .split... remove the GMT ... from the outputted string */}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Home = () => {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = () => {
    setLoading(true);

    if (message.length === 0) {
      setLoading(false);
      setError("Your message is empty!");
      return;
    }

    if (message.length > 100) {
      setLoading(false);
      setError("Your message must be less than 100 characters.");
      return;
    }

    postMessage.mutate({
      name: session?.user?.name as string,
      message,
    });

    setMessage("");
    setLoading(false);
    console.log("refetched!");
  };

  if (status === "loading") {
    return (
      <main className="flex flex-col items-center pt-4">
        Loading... <LoadingSpinner />
      </main>
    );
  }

  return (
    <>
      <header>
        <h1 className="text-3xl pt-4 pb-2 flex flex-col items-center">
          🦁 andreaspappas.xyz - Guestbook
        </h1>
      </header>
      <main className="flex flex-col items-center m-3">
        <div className=" p-1 border-dashed border-2 border-gray-500 rounded-lg">
          <p className="text-green-500 p-2">
            Come and say hi 👋, || share some wisdom 📖, || share a joke 🃏 -
            surprise me!
          </p>
        </div>

        {session ? (
          <div className="pt-10">
            {session.user?.image ? (
              <div className="flex items-center gap-2">
                <p>Hello 👋 {session.user?.name}</p>
                <Image
                  src={session.user!.image}
                  alt="s"
                  width={36}
                  height={36}
                  style={{ borderRadius: "50%" }}
                />
              </div>
            ) : (
              <p>Hello 👋 {session.user?.name}</p>
            )}

            <LogOutButton />

            <div className="pt-6">
              <p className="text-sm text-red-500">{error}</p>
              <input
                type="text"
                name="message"
                id="message"
                value={message}
                placeholder="Enter your message here..."
                // maxLength={100}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full px-4 py-2 mt-1 text-xl border-2 rounded-md bg-zinc-800 focus:outline-none focus:border-opacity-100 border-opacity-80 border-t-pink text-slate-200"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-2 mt-2 text-sm transition-colors duration-300 border-2 rounded-md cursor-pointer border-opacity-80 border-t-purple hover:bg-t-purple hover:bg-opacity-30 hover:text-white disabled:opacity-80"
                    onClick={() => handleSubmit()}
                  >
                    Sign ✍️
                  </button>
                </div>

                <p
                  className={clsx(
                    "text-lg",
                    message.length > 100 ? "text-red-500" : "text-gray-500"
                  )}
                >
                  {message.length}/100
                </p>
              </div>
            </div>

            {/* Render names and messages when logged in */}
            <div className="pt-10">
              <Messages />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 p-4 mt-10 border-2 rounded-md bg-[#202020] border-t-pink border-opacity-60">
              <span>
                <AuthButtons />
              </span>
              <p className="pt-1.5 text-sm text-slate-300 w-2/3">
                <strong>Sign the Guestbook</strong>. Share a message for a
                future visitor of my site. <br /> Log in with Discord or GitHub
                to comment. <br />{" "}
                <span className="text-gray-500">
                  Your information is only used to display your name to avoid
                  impersonation.
                </span>
              </p>
            </div>

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
