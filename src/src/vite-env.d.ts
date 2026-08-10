/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.svg?react" {
  import * as React from "react";

  const Component: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;

  export default Component;
}