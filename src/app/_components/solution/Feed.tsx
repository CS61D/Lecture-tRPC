"use client";

import { api } from "~/trpc/react";

export const Feed = () => {
  const { data, isLoading } = api.post.list.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (data) {
    return (
      <div className="space-y-1">
        {data.map((post) => (
          <div key={post.id}>
            <h2 className="text-xl">{post.title}</h2>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    );
  }
  return <div>No posts</div>;
};
