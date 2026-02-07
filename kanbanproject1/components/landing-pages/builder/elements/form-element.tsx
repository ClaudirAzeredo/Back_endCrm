import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BuilderElement, FormFieldConfig } from '@/lib/types/builder-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maskCPF, maskCNPJ, maskCEP, maskPhone, validateCPF, validateCNPJ, countries } from '@/lib/builder/form-utils';
import { toast } from 'sonner';

interface Props {
  element: BuilderElement;
}

export function FormElement({ element }: Props) {
  const styles: React.CSSProperties = {
    backgroundColor: element.styles.backgroundColor,
    padding: element.styles.padding,
    borderRadius: element.styles.borderRadius,
    borderWidth: element.styles.borderWidth,
    borderColor: element.styles.borderColor,
    borderStyle: element.styles.borderWidth ? 'solid' : undefined,
  };

  const rawFields = element.content.formFields || [];
  const fields: FormFieldConfig[] = rawFields.map(f => {
    if (typeof f === 'string') {
        return {
            id: f,
            type: f === 'email' ? 'email' : f === 'phone' ? 'phone' : 'text',
            label: f === 'name' ? 'Nome' : f === 'email' ? 'E-mail' : 'Telefone',
            placeholder: '',
            required: true,
            defaultCountry: 'BR'
        } as FormFieldConfig;
    }
    return f;
  });

  const [countrySelections, setCountrySelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialCountries: Record<string, string> = {};
    fields.forEach(field => {
      if (field.type === 'phone') {
        initialCountries[field.id] = field.defaultCountry || 'BR';
      }
    });
    setCountrySelections(initialCountries);
  }, [JSON.stringify(fields)]);

  const formSchema = z.object(
    fields.reduce((acc, field) => {
      let schema: z.ZodTypeAny = z.string();

      if (field.required) {
        schema = schema.min(1, 'Campo obrigatório');
      } else {
        schema = schema.optional().or(z.literal(''));
      }

      if (field.type === 'email' && field.required) {
        schema = schema.email('E-mail inválido');
      }
      
      if (field.type === 'cpf' && field.required) {
         schema = schema.refine(validateCPF, 'CPF inválido');
      }

      if (field.type === 'cnpj' && field.required) {
         schema = schema.refine(validateCNPJ, 'CNPJ inválido');
      }
      
      if (field.type === 'number') {
        const numberSchema = field.required
          ? z.coerce.number().min(1, 'Campo obrigatório')
          : z.coerce.number().optional();
        schema = numberSchema;
      }

      acc[field.id] = schema;
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {}),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formattedData: Record<string, unknown> = { ...data };
    
    fields.forEach(field => {
      if (field.type === 'phone') {
        const countryCode = countrySelections[field.id] || 'BR';
        const country = countries.find(c => c.code === countryCode);
        if (country) {
          const fieldId = field.id as keyof typeof data;
          const rawValue = data[fieldId];
          const cleanNumber = String(rawValue ?? '').replace(/\D/g, '');
          formattedData[field.id] = `${country.ddi}${cleanNumber}`;
        }
      }
    });
    
    formattedData.source = 'landing-page-builder';

    console.log('Form Submitted:', formattedData);
    toast.success('Formulário enviado com sucesso!', {
      description: 'Os dados foram validados e processados.'
    });
  };

  return (
    <form style={styles} className="w-full space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type === 'textarea' ? (
             <Textarea 
               {...form.register(field.id)} 
               placeholder={field.placeholder} 
             />
          ) : field.type === 'phone' ? (
             <div className="flex gap-2">
                <Select 
                  value={countrySelections[field.id]} 
                  onValueChange={(val) => {
                    setCountrySelections(prev => ({ ...prev, [field.id]: val }));
                    const currentVal = form.getValues(field.id);
                    form.setValue(field.id, maskPhone(currentVal, val));
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="mr-2">{country.flag}</span>
                        {country.ddi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Controller
                  control={form.control}
                  name={field.id}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Input
                      {...rest}
                      value={value}
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value, countrySelections[field.id]);
                        onChange(masked);
                      }}
                      placeholder={field.placeholder}
                      type="tel"
                    />
                  )}
                />
             </div>
          ) : (
            <Controller
              control={form.control}
              name={field.id}
              render={({ field: { onChange, value, ...rest } }) => (
                <Input
                  {...rest}
                  value={value}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (field.type === 'cpf') val = maskCPF(val);
                    if (field.type === 'cnpj') val = maskCNPJ(val);
                    if (field.type === 'cep') val = maskCEP(val);
                    onChange(val);
                  }}
                  type={field.type === 'number' ? 'number' : 'text'}
                  placeholder={field.placeholder}
                />
              )}
            />
          )}
          
          {form.formState.errors[field.id] && (
            <p className="text-sm text-red-500">
              {form.formState.errors[field.id]?.message as string}
            </p>
          )}
        </div>
      ))}
      
      <Button 
        type="submit" 
        className="w-full"
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff'
        }}
      >
        {element.content.submitLabel || 'Enviar'}
      </Button>
    </form>
  );
}
