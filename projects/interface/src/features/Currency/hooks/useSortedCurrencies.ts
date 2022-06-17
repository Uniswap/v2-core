import { currentCurrenciesSelector } from "@/state/selector";
import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
export const useSortedCurrencies = () => {
  const currencies = useRecoilValue(currentCurrenciesSelector);
  const [query, setQuery] = useState("");

  const sortedCurrencies = useMemo(() => {
    return currencies.filter(
      (currency) =>
        currency.name?.toLocaleLowerCase().includes(query.toLowerCase()) ||
        currency.symbol?.toLocaleLowerCase().includes(query.toLowerCase())
    );
  }, [query, currencies]);

  return { query, setQuery, sortedCurrencies };
};
