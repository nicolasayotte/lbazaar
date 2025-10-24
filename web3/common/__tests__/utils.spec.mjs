import { describe, expect, it, vi } from "vitest";

vi.mock("@hyperionbt/helios", () => ({
  bytesToText: (bytes) => Buffer.from(bytes).toString("utf8"),
  MintingPolicyHash: class {},
  UTxO: class {},
}));

import { getTokenNamesAddrs, toSchema } from "../utils.mjs";

describe("utils helpers", () => {
  it("toSchema recursively converts objects and arrays to Helios schema", () => {
    const input = {
      key: "value",
      nested: {
        list: [1, { inner: "text" }],
      },
    };

    const result = toSchema(input);

    expect(result).toEqual({
      map: [
        ["key", "value"],
        [
          "nested",
          {
            map: [ [ "list", [ 1, { map: [["inner", "text"]], }, ], ], ],
          },
        ],
      ],
    });
  });

  it("getTokenNamesAddrs collects token names and addresses for matching policy hash", async () => {
    const utxos = [
      {
        value: {
          assets: {
            mintingPolicies: [{ hex: "hash-1" }, { hex: "hash-2" }],
            getTokenNames: vi.fn((mph) => {
              if (mph.hex === "hash-2") {
                return [
                  { bytes: Buffer.from("(222)Course|169") },
                  { bytes: Buffer.from("(222)Course|170") },
                ];
              }
              return [];
            }),
          },
        },
        origOutput: {
          address: {
            toBech32: () => "addr_test1...",
          },
        },
      },
    ];

    const tokenMph = { hex: "hash-2" };

    const result = await getTokenNamesAddrs(tokenMph, utxos);

    expect(result.tokenNames).toEqual(["(222)Course|169", "(222)Course|170"]);
    expect(result.addresses).toEqual(["addr_test1...", "addr_test1..."]);
  });
});
