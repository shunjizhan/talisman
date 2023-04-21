import { AddressBookContact } from "@core/domains/app/store.addressBook"
import { act, renderHook, waitFor } from "@testing-library/react"
import { RecoilRoot } from "recoil"

import { addressBookState, useAddressBook } from "../useAddressBook"

const VITALIK: AddressBookContact = {
  address: "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
  name: "Vitalik",
  addressType: "ethereum",
}

test("allows you to add an address book contact", async () => {
  const { result } = renderHook(() => useAddressBook(), {
    wrapper: RecoilRoot,
  })
  expect(result.current.contacts.length).toBe(0)

  await act(async () => {
    await result.current.add(VITALIK)
  })

  waitFor(() => {
    expect(result.current.contacts.length).toBe(1)
    expect(result.current.contacts).toBe([VITALIK])
  })
})

test("allows you to edit an address book contact", async () => {
  const { result } = renderHook(() => useAddressBook(), {
    wrapper: ({ children }) =>
      RecoilRoot({ children, initializeState: ({ set }) => set(addressBookState, [VITALIK]) }),
  })
  waitFor(() => {
    expect(result.current.contacts.length).toBe(1)
    expect(result.current.contacts[0]).toBe(VITALIK)
  })
  await act(async () => {
    await result.current.edit({ address: VITALIK.address, name: "Gav" })
  })

  waitFor(() => {
    expect(result.current.contacts[0].name).toBe("Gav")
  })
})

test("allows you to delete an address book contact", async () => {
  const { result } = renderHook(() => useAddressBook(), {
    wrapper: ({ children }) =>
      RecoilRoot({ children, initializeState: ({ set }) => set(addressBookState, [VITALIK]) }),
  })
  waitFor(() => {
    expect(result.current.contacts.length).toBe(1)
    expect(result.current.contacts[0]).toBe(VITALIK)
  })

  await act(async () => {
    await result.current.deleteContact({ address: VITALIK.address })
  })

  waitFor(() => {
    expect(result.current.contacts.length).toBe(0)
  })
})
