import { supabase } from './supabase';
import { Quote, QuoteItem, QuoteWithItems, QuoteItemInput } from '../types/quotes';

// Helper functions to convert between camelCase (TypeScript) and snake_case (Supabase)
const quoteToSupabase = (quote: Partial<Quote>) => {
  const result: any = {};
  if (quote.client_name !== undefined) result.client_name = quote.client_name;
  if (quote.client_phone !== undefined) result.client_phone = quote.client_phone;
  if (quote.client_email !== undefined) result.client_email = quote.client_email;
  if (quote.client_address !== undefined) result.client_address = quote.client_address;
  if (quote.reference !== undefined) result.reference = quote.reference;
  if (quote.status !== undefined) result.status = quote.status;
  if (quote.subtotal !== undefined) result.subtotal = quote.subtotal;
  if (quote.discount_total !== undefined) result.discount_total = quote.discount_total;
  if (quote.vat_rate !== undefined) result.vat_rate = quote.vat_rate;
  if (quote.vat_amount !== undefined) result.vat_amount = quote.vat_amount;
  if (quote.total !== undefined) result.total = quote.total;
  return result;
};

const quoteFromSupabase = (data: any): Quote => ({
  id: data.id,
  user_id: data.user_id,
  client_name: data.client_name ?? undefined,
  client_phone: data.client_phone ?? undefined,
  client_email: data.client_email ?? undefined,
  client_address: data.client_address ?? undefined,
  reference: data.reference ?? undefined,
  status: data.status,
  subtotal: parseFloat(data.subtotal || 0),
  discount_total: parseFloat(data.discount_total || 0),
  vat_rate: parseFloat(data.vat_rate || 0),
  vat_amount: parseFloat(data.vat_amount || 0),
  total: parseFloat(data.total || 0),
  created_at: data.created_at,
  updated_at: data.updated_at,
});

const quoteItemToSupabase = (item: QuoteItemInput, quoteId: string) => ({
  quote_id: quoteId,
  item_type: item.item_type,
  label: item.label ?? null,
  width_mm: item.width_mm,
  height_mm: item.height_mm,
  quantity: item.quantity,
  configuration: item.configuration,
  base_cost: item.base_cost,
  price_without_vat: item.price_without_vat,
  vat_rate: item.vat_rate,
  total_with_vat: item.total_with_vat,
});

const quoteItemFromSupabase = (data: any): QuoteItem => ({
  id: data.id,
  quote_id: data.quote_id,
  user_id: data.user_id,
  item_type: data.item_type,
  label: data.label ?? undefined,
  width_mm: parseInt(data.width_mm, 10),
  height_mm: parseInt(data.height_mm, 10),
  quantity: parseInt(data.quantity, 10),
  configuration: data.configuration as QuoteItem['configuration'],
  base_cost: parseFloat(data.base_cost || 0),
  price_without_vat: parseFloat(data.price_without_vat || 0),
  vat_rate: parseFloat(data.vat_rate || 0),
  total_with_vat: parseFloat(data.total_with_vat || 0),
  created_at: data.created_at,
});

export const quotesApi = {
  /**
   * Create a new quote with items
   * Computes totals from items and inserts into quotes, then inserts all items
   */
  async createQuoteWithItems(params: {
    header: Partial<Quote>;
    items: QuoteItemInput[];
  }): Promise<QuoteWithItems> {
    // Calculate totals from items
    const subtotal = params.items.reduce((sum, item) => sum + item.price_without_vat * item.quantity, 0);
    const discountTotal = params.header.discount_total ?? 0;
    const vatRate = params.header.vat_rate ?? 0.19; // Default 19%
    const priceAfterDiscount = subtotal - discountTotal;
    const vatAmount = priceAfterDiscount * vatRate;
    const total = priceAfterDiscount + vatAmount;

    // Prepare quote header
    const quoteData = quoteToSupabase({
      ...params.header,
      status: params.header.status ?? 'draft',
      subtotal,
      discount_total: discountTotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total,
    });

    // Insert quote (user_id is set by Supabase RLS/default)
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([quoteData])
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      throw quoteError;
    }

    const createdQuote = quoteFromSupabase(quote);

    // Insert all items in a single call
    if (params.items.length > 0) {
      const itemsData = params.items.map((item) => quoteItemToSupabase(item, createdQuote.id));

      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsData)
        .select();

      if (itemsError) {
        console.error('Error creating quote items:', itemsError);
        // Try to clean up the quote if items fail
        await supabase.from('quotes').delete().eq('id', createdQuote.id);
        throw itemsError;
      }

      return {
        ...createdQuote,
        items: (items || []).map(quoteItemFromSupabase),
      };
    }

    return {
      ...createdQuote,
      items: [],
    };
  },

  /**
   * Fetch all quotes for the current user, ordered by created_at desc
   */
  async fetchQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }

    return (data || []).map(quoteFromSupabase);
  },

  /**
   * Fetch a single quote with its items
   */
  async fetchQuoteWithItems(id: string): Promise<QuoteWithItems | null> {
    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError) {
      console.error('Error fetching quote:', quoteError);
      throw quoteError;
    }

    if (!quote) {
      return null;
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching quote items:', itemsError);
      throw itemsError;
    }

    return {
      ...quoteFromSupabase(quote),
      items: (items || []).map(quoteItemFromSupabase),
    };
  },

  /**
   * Delete a quote (items will cascade delete)
   */
  async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  },
};

