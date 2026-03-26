import * as Router from 'expo-router';

type StaticRoute =
  | `/`
  | `/browse`
  | `/confirmations`
  | `/create-listing`
  | `/listing`
  | `/my-listings`
  | `/unlock`
  | `/_sitemap`;

type StaticRouteWithQuery = `${StaticRoute}${`?${string}` | `#${string}` | ''}`;

type StaticHrefInput =
  | { pathname: `/`; params?: Router.UnknownInputParams }
  | { pathname: `/browse`; params?: Router.UnknownInputParams }
  | { pathname: `/confirmations`; params?: Router.UnknownInputParams }
  | { pathname: `/create-listing`; params?: Router.UnknownInputParams }
  | { pathname: `/listing`; params: { id: string | number } }
  | { pathname: `/my-listings`; params?: Router.UnknownInputParams }
  | { pathname: `/unlock`; params: { id: string | number } }
  | { pathname: `/_sitemap`; params?: Router.UnknownInputParams };

type StaticHrefOutput =
  | { pathname: `/`; params?: Router.UnknownOutputParams }
  | { pathname: `/browse`; params?: Router.UnknownOutputParams }
  | { pathname: `/confirmations`; params?: Router.UnknownOutputParams }
  | { pathname: `/create-listing`; params?: Router.UnknownOutputParams }
  | { pathname: `/listing`; params: { id: string } }
  | { pathname: `/my-listings`; params?: Router.UnknownOutputParams }
  | { pathname: `/unlock`; params: { id: string } }
  | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams };

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | StaticHrefInput;
      hrefOutputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | StaticHrefOutput;
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | StaticRouteWithQuery
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | StaticHrefInput;
    }
  }
}
