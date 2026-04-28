"use client";



import {

  Compass,

  ClipboardList,

  BookOpen,

  Microscope,

  Scale,

  FlaskConical,

  Factory,

  FileSearch,

  ArrowLeftRight,

  type LucideProps,

} from "lucide-react";



const ICON_MAP: Record<string, React.FC<LucideProps>> = {

  Compass,

  ClipboardList,

  BookOpen,

  Microscope,

  Scale,

  FlaskConical,

  Factory,

  FileSearch,

  ArrowLeftRight,

};



interface StepIconProps extends LucideProps {

  name: string;

}



export function StepIcon({ name, ...props }: StepIconProps) {

  const Icon = ICON_MAP[name];

  if (!Icon) return <Compass {...props} />;

  return <Icon {...props} />;

}

