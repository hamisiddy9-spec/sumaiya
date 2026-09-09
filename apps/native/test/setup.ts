// jest setup — mock native-config-dependent Expo modules so unit tests run
// without a device/manifest.

jest.mock("expo-linking", () => {
  const actual = jest.requireActual("expo-linking");
  return {
    ...actual,
    // A dependency-free parser good enough for URL-shape assertions in tests.
    // The real expo-linking.parse needs native app config (Constants.expoConfig)
    // which isn't present under jest.
    parse: (url: string) => {
      const [head, query = ""] = url.split("?");
      const queryParams: Record<string, string> = {};
      new URLSearchParams(query).forEach((v, k) => {
        queryParams[k] = v;
      });
      const schemeMatch = head.match(/^([a-zA-Z0-9+.-]+):\/\//);
      const scheme = schemeMatch ? schemeMatch[1] : null;
      const rest = schemeMatch ? head.slice(schemeMatch[0].length) : head;
      const isWeb = scheme === "http" || scheme === "https";
      // Web URLs: host is the domain, path is everything after it.
      // Custom schemes (sumaiya://…): everything after :// is the path.
      let hostname: string | null = null;
      let path: string;
      if (isWeb) {
        const slash = rest.indexOf("/");
        hostname = slash === -1 ? rest : rest.slice(0, slash);
        path = slash === -1 ? "" : rest.slice(slash + 1);
      } else {
        path = rest;
      }
      path = path.replace(/^\/+/, "").replace(/\/+$/, "");
      return { scheme, hostname, path: path || null, queryParams };
    },
    createURL: (path = "", opts: { queryParams?: Record<string, string> } = {}) => {
      const qs = opts.queryParams
        ? "?" + new URLSearchParams(opts.queryParams).toString()
        : "";
      return `sumaiya://${path.replace(/^\/+/, "")}${qs}`;
    },
  };
});
