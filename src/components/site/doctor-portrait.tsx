import Image from 'next/image';
import {doctorProfile} from '@/config/doctor';
import {Botanical} from './site-shell';
export function DoctorPortrait({variant='hero'}:{variant?:'hero'|'about'}){
  if(doctorProfile.portraitSrc){return <Image className={`doctor-portrait doctor-portrait-${variant}`} src={doctorProfile.portraitSrc} alt={`Retrato de ${doctorProfile.name}`} width={640} height={640} sizes={variant==='hero'?'(max-width: 700px) 88vw, 45vw':'(max-width: 700px) 88vw, 40vw'} priority={variant==='hero'}/>;}
  if(variant==='about')return <div className="about-art-inner"><span className="eyebrow">Conheça o médico</span><p className="serif">Douglas<br/><em>Vaz</em></p><span className="about-art-caption">Um espaço para a sua história.</span></div>;
  return <Botanical className="hero-botanical"/>;
}
