
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";

interface DuplicateProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDuplicate: (newName: string) => boolean;
  profiles: string[];
}

export function DuplicateProfileDialog({ isOpen, onOpenChange, onDuplicate, profiles }: DuplicateProfileDialogProps) {
  const { t } = useSettings();

  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')).refine(
      (name) => !profiles.includes(name),
      t('validation.nameExists')
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: "" });
    }
  }, [isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const success = onDuplicate(values.name);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profileManager.duplicateProfileTitle')}</DialogTitle>
          <DialogDescription>{t('profileManager.duplicateProfileDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profileManager.newProfileNameLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('profileManager.newProfileNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button type="submit">{t('profileManager.duplicateButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
