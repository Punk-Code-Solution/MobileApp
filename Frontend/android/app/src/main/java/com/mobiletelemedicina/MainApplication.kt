/**
 * Sistema de Telemedicina - Aplicativo Mobile
 * 
 * Copyright (c) 2025-2026 Punk Code Solution
 * CNPJ: 61.805.210/0001-41
 * Rua do Aconchego, Ilhéus - BA, CEP 45656-627
 * 
 * Este software é propriedade da Punk Code Solution e está protegido
 * pelas leis de direitos autorais brasileiras e internacionais.
 * Licenciado sob os termos da licença MIT.
 */

package com.mobiletelemedicina

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
