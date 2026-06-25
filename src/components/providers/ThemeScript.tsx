export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem("dhcc-theme");
        var dark =
          stored === "dark" ||
          (stored !== "light" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.add(dark ? "dark" : "light");
      } catch (e) {
        document.documentElement.classList.add("light");
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
