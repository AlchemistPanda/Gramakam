'use client';

import { useState, useEffect } from 'react';
import GalleryGrid from '@/components/GalleryGrid';
import AnimatedSection from '@/components/AnimatedSection';
import { GalleryItem } from '@/types';
import { getGalleryItems, getGalleryYears } from '@/lib/services';

const fallbackItems: GalleryItem[] = [
  // ── Gramakam 2016 ──
  { id: 'arch-1', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0009.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-2', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0050.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-3', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0095.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-4', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0103.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-5', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0110.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-6', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0115.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-7', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0130.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-8', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0149.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-9', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0158.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  { id: 'arch-10', title: 'Gramakam 2016', imageUrl: '/images/archive/2016/img_0176.jpg', year: 2016, category: 'Gramakam 2016', type: 'image', createdAt: '2016-04-10' },
  // ── Gramakam 2017 ──
  { id: 'arch-11', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16427332_1272488472841607_3417589470700945908_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-12', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16427591_1272490019508119_2455324652896362426_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-13', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16427649_1272488659508255_4682821638592370052_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-14', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16473338_1272488652841589_3209498618536654288_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-15', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16508542_1272488889508232_837788483179167292_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-16', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16508968_1269317063158748_5257265442185857401_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-17', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/16938565_622412517955928_8446692041289409687_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-18', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17757368_643089829221530_6101419866620067602_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-19', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17759841_643089929221520_4025318700218835978_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-20', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17799146_1506546459356163_5606970545732342798_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-21', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17800177_1241747159276169_3443771523500286339_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-22', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17861675_1506546519356157_7369466566811906025_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-23', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17883643_643089425888237_3077869281388125446_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-24', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17883942_643089552554891_5406694572949944626_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-25', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17884267_643089479221565_7649563903978503751_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-26', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17884427_643089745888205_2054537928832206396_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-27', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/17903528_643089792554867_4123849160804535207_n.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-28', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0015.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-29', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0022.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-30', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0037.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-31', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0038.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-32', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0040.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-33', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0044.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-34', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0046.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-35', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0047.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-36', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0049.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-37', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0054.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-38', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_0072.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-39', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3211.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-40', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3235.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-41', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3244.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-42', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3266.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-43', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3269.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-44', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3359.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-45', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3384.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-46', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3430.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-47', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3530.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-48', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3873.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-49', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3876.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-50', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3882.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-51', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3883.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-52', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3884.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-53', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3902.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-54', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3910.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-55', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3917.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-56', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3938.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-57', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3980.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-58', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3985.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-59', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_3996.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-60', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4004.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-61', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4023.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-62', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4653.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-63', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4691.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-64', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4699.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-65', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4705.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-66', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4738.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-67', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4745.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-68', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4802.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-69', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4812.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-70', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_4832.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-71', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5069.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-72', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5101.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-73', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5114.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-74', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5120.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-75', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5126.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-76', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5133.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-77', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5135.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-78', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5137.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-79', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5145.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-80', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5150.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-81', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5155.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-82', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5160.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-83', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5179.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-84', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5195.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-85', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5213.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-86', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5248.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-87', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5253.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-88', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5255.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-89', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5267.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-90', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5270.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-91', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5273.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-92', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5282.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-93', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5288.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-94', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5298.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-95', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5301.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-96', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5314.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-97', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5321.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-98', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5328.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-99', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5358.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-100', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5367.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-101', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5371.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-102', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5381.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-103', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5383.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-104', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5385.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-105', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5387.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-106', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5395.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-107', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5402.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-108', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5404.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-109', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5416.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-110', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5418.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-111', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5435.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-112', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5442.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-113', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5447.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-114', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5452.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  { id: 'arch-115', title: 'Gramakam 2017', imageUrl: '/images/archive/2017/img_5465.jpg', year: 2017, category: 'Gramakam 2017', type: 'image', createdAt: '2017-04-10' },
  // ── Gramakam 2018 ──
  { id: 'arch-116', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27867306_1987737734573118_7876097761777348687_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-117', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27867307_775055372691641_6653753584910029205_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-118', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27971551_775054812691697_1239931995052317970_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-119', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27972384_775055279358317_8770405322238235323_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-120', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27972686_1987737654573126_9085324604848166061_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-121', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27972844_775055466024965_1827064581264770280_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-122', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27972934_775055066025005_1133633130323719530_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-123', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27973259_1987736477906577_3948157211369445839_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-124', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27973267_775054822691696_761360849394387193_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-125', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/27973651_1987736447906580_5555832669798321111_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-126', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28055661_775055532691625_4696393427297220956_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-127', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28056288_775055186024993_7055759861968868194_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-128', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28056524_735933449951269_3797917077129701159_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-129', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28058720_775055232691655_6966281045718395530_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-130', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28058776_775054819358363_3889191022673857983_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-131', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28166248_775055319358313_6085606736929321343_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-132', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28166303_1987737631239795_4105687573656303939_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-133', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28166660_1987737744573117_8783068195989532978_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-134', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28167286_775055436024968_2844618791679476428_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
  { id: 'arch-135', title: 'Gramakam 2018', imageUrl: '/images/archive/2018/28276743_775055126024999_8257317321838956998_n.jpg', year: 2018, category: 'Gramakam 2018', type: 'image', createdAt: '2018-04-07' },
];
const fallbackYears = [2018, 2017, 2016];

export default function GalleryClient() {
  const [items, setItems] = useState<GalleryItem[]>(fallbackItems);
  const [years, setYears] = useState<number[]>(fallbackYears);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const [fetchedItems, fetchedYears] = await Promise.all([
          getGalleryItems(),
          getGalleryYears(),
        ]);
        if (fetchedItems.length > 0) {
          setItems([...fetchedItems, ...fallbackItems]);
          setYears([...new Set([...fetchedYears, ...fallbackYears])].sort((a, b) => b - a));
        }
      } catch {
        // Firebase not configured — use fallback data
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  return (
    <div className="section-padding bg-white min-h-screen">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">
              Festival Memories
            </p>
            <h1 className="heading-xl text-charcoal mb-4">Gallery</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Relive the magic of Gramakam through our collection of photos and
              videos from past editions of the festival.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading gallery...</p>
          </div>
        ) : (
          <GalleryGrid items={items} years={years} />
        )}
      </div>
    </div>
  );
}
