import { CircleCheck, CircleX } from "lucide-react";
import { toast } from "sonner";

export function ToastError(message: string) {
  toast.error(<p className="ml-2 text-base font-bold text-red-300">{message}</p>, { icon: <CircleX className="text-red-300" /> });
}

export function ToastSucess(message: string) {
  toast.error(<p className="ml-2 text-base font-bold text-green-300">{message}</p>, { icon: <CircleCheck className="text-green-300" /> });
}
