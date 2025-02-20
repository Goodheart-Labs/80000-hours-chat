import { throttle } from "lodash-es";

export const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior,
  });
};

// Throttle the scroll function to execute at most once every 100ms
// The trailing option ensures the function is called one final time after the throttle period
export const throttledScrollToBottom = throttle(scrollToBottom, 100, {
  trailing: true,
});
