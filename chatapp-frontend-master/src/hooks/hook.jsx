import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const useErrors = (errors = []) => {
  useEffect(() => {
    errors.forEach(({ isError, error, fallback }) => {
      if (isError) {
        if (fallback) fallback();
        else toast.error(error?.data?.message || "Something went wrong");
      }
    });
  }, [errors]);
};

const useAsyncMutation = (mutatationHook) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const [mutate] = mutatationHook();

  const executeMutation = async (toastMessage, ...args) => {
    setIsLoading(true);
    const toastId = toast.loading(toastMessage || "Updating data...");

    try {
      const res = await mutate(...args);

      if (res.data) {
        toast.success(res.data.message || "Updated data successfully", {
          id: toastId,
        });
        setData(res.data);
      } else {
        toast.error(res?.error?.data?.message || "Something went wrong", {
          id: toastId,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return [executeMutation, isLoading, data];
};

// FIX Bug 1 & Bug 6: useSocketEvents was re-registering listeners on every
// render because the `handlers` object passed in was a new reference each time.
// Solution: store the latest handlers in a ref so the stable wrapper functions
// always call the most-current handler without needing to re-subscribe.
// Listeners are registered once per socket instance and cleaned up on unmount.
const useSocketEvents = (socket, handlers) => {
  const handlersRef = useRef(handlers);

  // Keep the ref up-to-date on every render without triggering re-subscription
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!socket) return;

    // Create stable wrapper functions that always delegate to the latest handler
    const wrappers = {};
    Object.keys(handlers).forEach((event) => {
      wrappers[event] = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrappers[event]);
    });

    return () => {
      Object.keys(wrappers).forEach((event) => {
        socket.off(event, wrappers[event]);
      });
    };
    // Only re-run when socket changes — NOT when handlers object changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
};

export { useErrors, useAsyncMutation, useSocketEvents };
