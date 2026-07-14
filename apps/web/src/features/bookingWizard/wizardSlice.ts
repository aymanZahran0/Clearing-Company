import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface WizardState {
  serviceId: string | null;
  addOnIds: string[];
  propertyType: string | null;
  rooms: number | null;
  areaSqm: number | null;
  conditionModifiers: string[];
  addressId: string | null;
  requestedDate: string | null;
  requestedTimeSlotId: string | null;
  discountCode: string | null;
  quoteId: string | null;
}

const initialState: WizardState = {
  serviceId: null,
  addOnIds: [],
  propertyType: null,
  rooms: null,
  areaSqm: null,
  conditionModifiers: [],
  addressId: null,
  requestedDate: null,
  requestedTimeSlotId: null,
  discountCode: null,
  quoteId: null,
};

const wizardSlice = createSlice({
  name: "bookingWizard",
  initialState,
  reducers: {
    setServiceId: (state, action: PayloadAction<string>) => {
      state.serviceId = action.payload;
    },
    setPropertyDetails: (
      state,
      action: PayloadAction<
        Pick<WizardState, "propertyType" | "rooms" | "areaSqm" | "conditionModifiers">
      >
    ) => {
      Object.assign(state, action.payload);
    },
    setAddOnIds: (state, action: PayloadAction<string[]>) => {
      state.addOnIds = action.payload;
    },
    setAddress: (state, action: PayloadAction<string>) => {
      state.addressId = action.payload;
    },
    setSchedule: (
      state,
      action: PayloadAction<{ requestedDate: string; requestedTimeSlotId?: string }>
    ) => {
      state.requestedDate = action.payload.requestedDate;
      state.requestedTimeSlotId = action.payload.requestedTimeSlotId ?? null;
    },
    setDiscountCode: (state, action: PayloadAction<string | null>) => {
      state.discountCode = action.payload;
    },
    setQuoteId: (state, action: PayloadAction<string>) => {
      state.quoteId = action.payload;
    },
    resetWizard: () => initialState,
  },
});

export const {
  setServiceId,
  setPropertyDetails,
  setAddOnIds,
  setAddress,
  setSchedule,
  setDiscountCode,
  setQuoteId,
  resetWizard,
} = wizardSlice.actions;
export default wizardSlice.reducer;
