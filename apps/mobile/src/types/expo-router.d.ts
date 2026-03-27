import * as Router from 'expo-router';

type StaticRoute =
  | `/`
  | `/browse`
  | `/buy-credits`
  | `/confirmation-success`
  | `/confirmations`
  | `/contact-revealed`
  | `/contact-support`
  | `/create-listing`
  | `/create-listing-details`
  | `/create-listing-photos`
  | `/create-listing-review`
  | `/credits`
  | `/dispute`
  | `/edit-profile`
  | `/filters`
  | `/help-center`
  | `/login`
  | `/listing`
  | `/listing-gallery`
  | `/listing-stats`
  | `/listing-submitted`
  | `/map`
  | `/mpesa-processing`
  | `/my-listing`
  | `/my-listings`
  | `/notifications`
  | `/onboarding`
  | `/payment-success`
  | `/profile`
  | `/rate-review`
  | `/referral`
  | `/register`
  | `/saved`
  | `/search`
  | `/settings`
  | `/transaction`
  | `/transactions`
  | `/unlock`
  | `/verify-otp`
  | `/app-update`
  | `/_sitemap`;

type StaticRouteWithQuery = `${StaticRoute}${`?${string}` | `#${string}` | ''}`;

type StaticHrefInput =
  | { pathname: `/`; params?: Router.UnknownInputParams }
  | { pathname: `/browse`; params?: Router.UnknownInputParams }
  | { pathname: `/buy-credits`; params?: Router.UnknownInputParams }
  | { pathname: `/confirmation-success`; params?: Router.UnknownInputParams }
  | { pathname: `/confirmations`; params?: Router.UnknownInputParams }
  | { pathname: `/contact-revealed`; params: { id: string | number } }
  | { pathname: `/contact-support`; params?: Router.UnknownInputParams }
  | { pathname: `/create-listing`; params?: Router.UnknownInputParams }
  | { pathname: `/create-listing-details`; params?: Router.UnknownInputParams }
  | { pathname: `/create-listing-photos`; params?: Router.UnknownInputParams }
  | { pathname: `/create-listing-review`; params?: Router.UnknownInputParams }
  | { pathname: `/credits`; params?: Router.UnknownInputParams }
  | { pathname: `/dispute`; params?: Router.UnknownInputParams }
  | { pathname: `/edit-profile`; params?: Router.UnknownInputParams }
  | { pathname: `/filters`; params?: Router.UnknownInputParams }
  | { pathname: `/help-center`; params?: Router.UnknownInputParams }
  | { pathname: `/login`; params?: Router.UnknownInputParams }
  | { pathname: `/listing`; params: { id: string | number } }
  | { pathname: `/listing-gallery`; params: { id: string | number } }
  | { pathname: `/listing-stats`; params: { id: string | number } }
  | { pathname: `/listing-submitted`; params?: Router.UnknownInputParams }
  | { pathname: `/map`; params?: Router.UnknownInputParams }
  | { pathname: `/mpesa-processing`; params?: Router.UnknownInputParams }
  | { pathname: `/my-listing`; params: { id: string | number } }
  | { pathname: `/my-listings`; params?: Router.UnknownInputParams }
  | { pathname: `/notifications`; params?: Router.UnknownInputParams }
  | { pathname: `/onboarding`; params?: Router.UnknownInputParams }
  | { pathname: `/payment-success`; params?: Router.UnknownInputParams }
  | { pathname: `/profile`; params?: Router.UnknownInputParams }
  | { pathname: `/rate-review`; params?: Router.UnknownInputParams }
  | { pathname: `/referral`; params?: Router.UnknownInputParams }
  | { pathname: `/register`; params?: Router.UnknownInputParams }
  | { pathname: `/saved`; params?: Router.UnknownInputParams }
  | { pathname: `/search`; params?: Router.UnknownInputParams }
  | { pathname: `/settings`; params?: Router.UnknownInputParams }
  | { pathname: `/transaction`; params: { id: string | number } }
  | { pathname: `/transactions`; params?: Router.UnknownInputParams }
  | { pathname: `/unlock`; params: { id: string | number } }
  | { pathname: `/verify-otp`; params?: Router.UnknownInputParams }
  | { pathname: `/app-update`; params?: Router.UnknownInputParams }
  | { pathname: `/_sitemap`; params?: Router.UnknownInputParams };

type StaticHrefOutput =
  | { pathname: `/`; params?: Router.UnknownOutputParams }
  | { pathname: `/browse`; params?: Router.UnknownOutputParams }
  | { pathname: `/buy-credits`; params?: Router.UnknownOutputParams }
  | { pathname: `/confirmation-success`; params?: Router.UnknownOutputParams }
  | { pathname: `/confirmations`; params?: Router.UnknownOutputParams }
  | { pathname: `/contact-revealed`; params: { id: string } }
  | { pathname: `/contact-support`; params?: Router.UnknownOutputParams }
  | { pathname: `/create-listing`; params?: Router.UnknownOutputParams }
  | { pathname: `/create-listing-details`; params?: Router.UnknownOutputParams }
  | { pathname: `/create-listing-photos`; params?: Router.UnknownOutputParams }
  | { pathname: `/create-listing-review`; params?: Router.UnknownOutputParams }
  | { pathname: `/credits`; params?: Router.UnknownOutputParams }
  | { pathname: `/dispute`; params?: Router.UnknownOutputParams }
  | { pathname: `/edit-profile`; params?: Router.UnknownOutputParams }
  | { pathname: `/filters`; params?: Router.UnknownOutputParams }
  | { pathname: `/help-center`; params?: Router.UnknownOutputParams }
  | { pathname: `/login`; params?: Router.UnknownOutputParams }
  | { pathname: `/listing`; params: { id: string } }
  | { pathname: `/listing-gallery`; params: { id: string } }
  | { pathname: `/listing-stats`; params: { id: string } }
  | { pathname: `/listing-submitted`; params?: Router.UnknownOutputParams }
  | { pathname: `/map`; params?: Router.UnknownOutputParams }
  | { pathname: `/mpesa-processing`; params?: Router.UnknownOutputParams }
  | { pathname: `/my-listing`; params: { id: string } }
  | { pathname: `/my-listings`; params?: Router.UnknownOutputParams }
  | { pathname: `/notifications`; params?: Router.UnknownOutputParams }
  | { pathname: `/onboarding`; params?: Router.UnknownOutputParams }
  | { pathname: `/payment-success`; params?: Router.UnknownOutputParams }
  | { pathname: `/profile`; params?: Router.UnknownOutputParams }
  | { pathname: `/rate-review`; params?: Router.UnknownOutputParams }
  | { pathname: `/referral`; params?: Router.UnknownOutputParams }
  | { pathname: `/register`; params?: Router.UnknownOutputParams }
  | { pathname: `/saved`; params?: Router.UnknownOutputParams }
  | { pathname: `/search`; params?: Router.UnknownOutputParams }
  | { pathname: `/settings`; params?: Router.UnknownOutputParams }
  | { pathname: `/transaction`; params: { id: string } }
  | { pathname: `/transactions`; params?: Router.UnknownOutputParams }
  | { pathname: `/unlock`; params: { id: string } }
  | { pathname: `/verify-otp`; params?: Router.UnknownOutputParams }
  | { pathname: `/app-update`; params?: Router.UnknownOutputParams }
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
