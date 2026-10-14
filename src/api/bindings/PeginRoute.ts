/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  AddCollateralRequest,
  AddCollateralResponse,
  GetCollateralResponse,
  PeginConfigurationRequest,
  PeginQuoteStatusDTO,
} from "./data-contracts";

export namespace Pegin {
  /**
   * @description  Adds PegIn Collateral
   * @name PostAddCollateral
   * @summary Add PegIn Collateral
   * @request POST:/pegin/addCollateral
   */
  export namespace PostAddCollateral {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddCollateralRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddCollateralResponse;
  }

  export const PostAddCollateralPath = "/pegin/addCollateral";

  /**
   * @description  Get PegIn Collateral
   * @name CollateralList
   * @summary Get PegIn Collateral
   * @request GET:/pegin/collateral
   */
  export namespace CollateralList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCollateralResponse;
  }

  export const CollateralListPath = "/pegin/collateral";

  /**
   * @description  Set the configuration for the Pegin service. Included in the management API.
   * @name PostConfiguration
   * @summary Set Pegin Config
   * @request POST:/pegin/configuration
   */
  export namespace PostConfiguration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PeginConfigurationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostConfigurationPath = "/pegin/configuration";

  /**
   * @description  Returns the status of an accepted pegin quote
   * @name StatusList
   * @summary GetPeginStatus
   * @request GET:/pegin/status
   */
  export namespace StatusList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hash of the quote
       * @format string
       */
      quoteHash: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PeginQuoteStatusDTO;
  }

  export const StatusListPath = "/pegin/status";
}
