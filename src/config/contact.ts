import { contactConfigSchema } from "../domain/restaurant";

export const contactConfig = contactConfigSchema.parse({
  email: "wangruiqiao7@gmail.com"
});

export function buildMailto(
  subject: string,
  body =
    "Hello Ruiqiao, I viewed your Restaurant Page Studio portfolio and would like to discuss an employee opportunity that fits your student visa work conditions."
) {
  const params = new URLSearchParams({
    subject,
    body
  });

  return `mailto:${contactConfig.email}?${params.toString()}`;
}
