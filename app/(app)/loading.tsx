import Loader from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
      <Loader size="md" />
    </div>
  );
}
