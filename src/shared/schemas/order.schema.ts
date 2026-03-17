import { z } from "zod";

export const orderFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().refine((val) => val.replace(/\D/g, "").length >= 10, {
    message: "Telefone inválido",
  }),
  cpf: z.string().refine((val) => val.replace(/\D/g, "").length === 11, {
    message: "CPF inválido",
  }),
  cep: z.string().refine((val) => val.replace(/\D/g, "").length === 8, {
    message: "CEP inválido",
  }),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .min(2, "Estado é obrigatório")
    .max(2, "Use a sigla do estado"),
  description: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const whatsappOrderFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().refine((val) => val.replace(/\D/g, "").length === 11, {
    message: "CPF inválido",
  }),
  cep: z.string().refine((val) => val.replace(/\D/g, "").length === 8, {
    message: "CEP inválido",
  }),
  street: z.string().max(120).optional().or(z.literal("")),
  number: z.string().max(20).optional().or(z.literal("")),
  complement: z.string().max(120).optional().or(z.literal("")),
  neighborhood: z.string().max(60).optional().or(z.literal("")),
  city: z.string().max(60).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  description: z.string().optional(),
});

export type WhatsappOrderFormValues = z.infer<typeof whatsappOrderFormSchema>;
