import { createSearchParamsCache, parseAsBoolean, parseAsString } from "nuqs/server";

export const voicesSearchParams = {
    query: parseAsString.withDefault(""),
    cloning: parseAsBoolean.withDefault(false),
};

export const voicesSearchParamsCache =
    createSearchParamsCache(voicesSearchParams);