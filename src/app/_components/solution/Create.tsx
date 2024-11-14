"use client";

"use client";

import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const PostValidator = z.object({
  title: z.string(),
  content: z.string(),
});

type Post = z.infer<typeof PostValidator>;

export const CreatePost = () => {
  const form = useForm<Post>({
    resolver: zodResolver(PostValidator),
  });

  const { handleSubmit, control } = form;
  const utils = api.useUtils();

  const { mutate, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
    },
  });

  const onSubmit = async (values: Post) => {
    mutate(values);
  };

  const onError = (error: unknown) => {
    console.log("error");
    console.log(error);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Post Title</FormLabel>
              <FormControl>
                <Input placeholder="Status" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Post Name</FormLabel>
              <FormControl>
                <Input placeholder="Status" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="secondary" disabled={isPending}>
          Submit
        </Button>
      </form>
    </Form>
  );
};
